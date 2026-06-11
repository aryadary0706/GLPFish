import { supabase } from "../lib/supabase.js";
import { checkModelHealth, predictFishQuality } from "../lib/model.js";

export const QualityPred = async (batchId) => {
  const { error: startBatchErr } = await supabase
    .from("batches")
    .update({
      status: "processing",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (startBatchErr) throw startBatchErr;

  const modelReady = await checkModelHealth();
  if (!modelReady) {
    await supabase
      .from("batches")
      .update({ status: "failed", preprocessed_status: "rejected" })
      .eq("id", batchId);
    throw { status: 503, message: "Model server tidak tersedia, coba beberapa saat lagi." };
  }

  const { data: fishes, error: fishesErr } = await supabase
    .from("fishes")
    .select("id, fish_index, eye_image_id, gill_image_id")
    .eq("batch_id", batchId)
    .eq("status", "pending");

  if (fishesErr) throw fishesErr;
  if (!fishes || fishes.length === 0) {
    await supabase
      .from("batches")
      .update({ status: "failed", preprocessed_status: "rejected" })
      .eq("id", batchId);
    throw { status: 404, message: "Tidak ada ikan dengan status pending di batch ini." };
  }

  const results = [];
  const errors = [];

  for (const fish of fishes) {
    try {
      const { data: images, error: imgErr } = await supabase
        .from("images")
        .select("id, storage_path, mime_type")
        .in("id", [fish.eye_image_id, fish.gill_image_id]);

      if (imgErr) throw imgErr;

      const eyeImg = images.find((img) => img.id === fish.eye_image_id);
      const gillImg = images.find((img) => img.id === fish.gill_image_id);

      if (!eyeImg || !gillImg) {
        throw new Error(`Gambar untuk ikan #${fish.fish_index} tidak ditemukan.`);
      }

      const [eyeDownload, gillDownload] = await Promise.all([
        supabase.storage.from("images").download(eyeImg.storage_path),
        supabase.storage.from("images").download(gillImg.storage_path),
      ]);

      if (eyeDownload.error) throw new Error("Gagal download foto mata: " + eyeDownload.error.message);
      if (gillDownload.error) throw new Error("Gagal download foto insang: " + gillDownload.error.message);

      const eyeBuffer = Buffer.from(await eyeDownload.data.arrayBuffer());
      const gillBuffer = Buffer.from(await gillDownload.data.arrayBuffer());

      const prediction = await predictFishQuality(
        eyeBuffer,
        eyeImg.mime_type,
        gillBuffer,
        gillImg.mime_type
      );

      const rawAvg = (prediction.mata.confidence + prediction.insang.confidence) / 2;
      const dbConfidenceAvg = rawAvg > 1 ? rawAvg / 100 : rawAvg;
      const dbEyeConfidence = prediction.mata.confidence > 1 ? prediction.mata.confidence / 100 : prediction.mata.confidence;
      const dbGillConfidence = prediction.insang.confidence > 1 ? prediction.insang.confidence / 100 : prediction.insang.confidence;

      const { error: predErr } = await supabase
        .from("prediction_results")
        .insert({
          fish_id: fish.id,
          confidence_score: dbConfidenceAvg,
          grade: prediction.grade,
          label_text: prediction.label,
          exportable: prediction.layak_ekspor,
          eyes_status: prediction.mata.status,
          eyes_confidence_score: dbEyeConfidence,
          gill_status: prediction.insang.status,
          gill_confidence_score: dbGillConfidence,
          waktu_proses_ms: prediction.waktu_proses_ms,
        });

      if (predErr) throw predErr;

      const { error: updateErr } = await supabase
        .from("fishes")
        .update({ status: "done" })
        .eq("id", fish.id);

      if (updateErr) throw updateErr;

      results.push({
        fish_id: fish.id,
        fish_index: fish.fish_index,
        grade: prediction.grade,
        confidence: dbConfidenceAvg,
      });
    } catch (fishErr) {
      console.error(`[predict] ikan #${fish.fish_index}:`, fishErr.message);
      await supabase.from("fishes").update({ status: "failed" }).eq("id", fish.id);
      errors.push({
        fish_id: fish.id,
        fish_index: fish.fish_index,
        error: fishErr.message,
      });
    }
  }

  const allFailed = results.length === 0;
  await supabase
    .from("batches")
    .update({
      status: allFailed ? "failed" : "done",
      preprocessed_status: allFailed ? "rejected" : "saved",
    })
    .eq("id", batchId);

  return {
    success: !allFailed,
    batch_id: batchId,
    total: fishes.length,
    success_count: results.length,
    fail_count: errors.length,
    results,
    errors,
  };
};