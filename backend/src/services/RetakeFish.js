import { supabase } from "../lib/supabase.js";
import { checkModelHealth, predictFishQuality } from "../lib/model.js";

function _ext(mimetype) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mimetype] ?? ".jpg";
}

export const retakeFishImages = async (userId, fishId, files) => {
  if (!fishId) throw { status: 400, message: "fish_id wajib disertakan." };
  if (!files?.eye?.[0]) throw { status: 400, message: "Foto mata wajib dikirim." };
  if (!files?.gill?.[0]) throw { status: 400, message: "Foto insang wajib dikirim." };

  const { data: fish, error: fishErr } = await supabase
    .from("fishes")
    .select("id, batch_id, fish_index, eye_image_id, gill_image_id")
    .eq("id", fishId)
    .single();

  if (fishErr || !fish) {
    throw { status: 404, message: "Ikan tidak ditemukan." };
  }

  const { data: batch, error: batchErr } = await supabase
    .from("batches")
    .select("id, user_id, status, preprocessed_status")
    .eq("id", fish.batch_id)
    .single();

  if (batchErr || !batch) {
    throw { status: 404, message: "Batch tidak ditemukan." };
  }

  if (batch.user_id !== userId) {
    throw { status: 403, message: "Akses ditolak untuk batch ini." };
  }

  if (batch.preprocessed_status === "saved" || batch.preprocessed_status === "rejected") {
    throw { status: 400, message: "Batch sudah final, tidak bisa diubah." };
  }

  const { data: oldImages, error: oldImgErr } = await supabase
    .from("images")
    .select("id, storage_path")
    .in("id", [fish.eye_image_id, fish.gill_image_id].filter(Boolean));

  if (oldImgErr) throw oldImgErr;

  const oldPathByImageId = {};
  for (const img of oldImages || []) {
    oldPathByImageId[img.id] = img.storage_path;
  }

  const eyeFile = files.eye[0];
  const gillFile = files.gill[0];
  const timestamp = Date.now();

  const newEyePath = `${userId}/${batch.id}/${timestamp}_eye_retake${_ext(eyeFile.mimetype)}`;
  const newGillPath = `${userId}/${batch.id}/${timestamp}_gill_retake${_ext(gillFile.mimetype)}`;

  const uploadedNewPaths = [];

  try {
    const [eyeUpload, gillUpload] = await Promise.all([
      supabase.storage.from("images").upload(newEyePath, eyeFile.buffer, {
        contentType: eyeFile.mimetype,
        upsert: false,
      }),
      supabase.storage.from("images").upload(newGillPath, gillFile.buffer, {
        contentType: gillFile.mimetype,
        upsert: false,
      }),
    ]);

    if (eyeUpload.error) throw new Error("Gagal upload foto mata: " + eyeUpload.error.message);
    if (gillUpload.error) throw new Error("Gagal upload foto insang: " + gillUpload.error.message);

    uploadedNewPaths.push(eyeUpload.data.path, gillUpload.data.path);

    const [eyeUpd, gillUpd] = await Promise.all([
      supabase
        .from("images")
        .update({
          storage_path: eyeUpload.data.path,
          mime_type: eyeFile.mimetype,
          file_size: eyeFile.size,
        })
        .eq("id", fish.eye_image_id)
        .select()
        .single(),
      supabase
        .from("images")
        .update({
          storage_path: gillUpload.data.path,
          mime_type: gillFile.mimetype,
          file_size: gillFile.size,
        })
        .eq("id", fish.gill_image_id)
        .select()
        .single(),
    ]);

    if (eyeUpd.error) throw eyeUpd.error;
    if (gillUpd.error) throw gillUpd.error;

    const oldPathsToDelete = Object.values(oldPathByImageId).filter(Boolean);
    if (oldPathsToDelete.length > 0) {
      await supabase.storage.from("images").remove(oldPathsToDelete);
    }

    await supabase.from("prediction_results").delete().eq("fish_id", fish.id);

    await supabase
      .from("fishes")
      .update({ status: "pending" })
      .eq("id", fish.id);

    const modelReady = await checkModelHealth();
    if (!modelReady) {
      return {
        success: true,
        fish_id: fish.id,
        fish_index: fish.fish_index,
        predicted: false,
        message: "Foto berhasil diganti. Model server belum siap, prediksi akan dijalankan saat batch diproses ulang.",
      };
    }

    const prediction = await predictFishQuality(
      eyeFile.buffer,
      eyeFile.mimetype,
      gillFile.buffer,
      gillFile.mimetype,
    );

    const rawAvg = (prediction.mata.confidence + prediction.insang.confidence) / 2;
    const dbConfidenceAvg = rawAvg > 1 ? rawAvg / 100 : rawAvg;
    const dbEyeConfidence = prediction.mata.confidence > 1
      ? prediction.mata.confidence / 100
      : prediction.mata.confidence;
    const dbGillConfidence = prediction.insang.confidence > 1
      ? prediction.insang.confidence / 100
      : prediction.insang.confidence;

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

    await supabase
      .from("fishes")
      .update({ status: "done" })
      .eq("id", fish.id);

    return {
      success: true,
      fish_id: fish.id,
      fish_index: fish.fish_index,
      predicted: true,
      grade: prediction.grade,
      confidence: dbConfidenceAvg,
    };
  } catch (error) {
    console.error(`[retake] Error fish ${fishId}:`, error.message);

    if (uploadedNewPaths.length > 0) {
      try {
        await supabase.storage.from("images").remove(uploadedNewPaths);
        console.log(`[retake-rollback] Hapus ${uploadedNewPaths.length} files baru dari storage`);
      } catch (cleanupErr) {
        console.error(`[retake-rollback] Error cleanup:`, cleanupErr.message);
      }
    }

    throw error;
  }
};
