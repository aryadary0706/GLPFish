import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";
import { checkModelHealth, predictFishQuality } from "../lib/model.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/upload/predict
// Prediksi ikan dari gambar yang sudah tersimpan di DB
// Flow: Update batch 'processing' → batch_id → fishes (pending) → download images → prediksi → simpan hasil → Update batch akhir
// ─────────────────────────────────────────────────────────────
router.post("/predict", requireAuth, async (req, res) => {
  const { batch_id } = req.body;
  if (!batch_id) {
    return res.status(400).json({ error: "batch_id wajib disertakan." });
  }

  try {
    // 1. Awal proses → Set status batch menjadi 'processing'
    const { error: startBatchErr } = await supabase
      .from("batches")
      .update({
        status: "processing",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", batch_id);

    if (startBatchErr) throw startBatchErr;

    // 2. Cek kesiapan model AI
    const modelReady = await checkModelHealth();
    if (!modelReady) {
      // Jika model mati, kembalikan status batch ke failed/rejected sebelum response
      await supabase
        .from("batches")
        .update({ status: "failed", preprocessed_status: "rejected" })
        .eq("id", batch_id);

      return res.status(503).json({
        error: "Model server tidak tersedia, coba beberapa saat lagi.",
      });
    }

    // 3. Ambil semua ikan pending di batch ini beserta image id-nya
    const { data: fishes, error: fishesErr } = await supabase
      .from("fishes")
      .select("id, fish_index, eye_image_id, gill_image_id")
      .eq("batch_id", batch_id)
      .eq("status", "pending");

    if (fishesErr) throw fishesErr;
    if (!fishes || fishes.length === 0) {
      // Jika tidak ada data ikan, kembalikan status batch ke failed/rejected
      await supabase
        .from("batches")
        .update({ status: "failed", preprocessed_status: "rejected" })
        .eq("id", batch_id);

      return res
        .status(404)
        .json({ error: "Tidak ada ikan dengan status pending di batch ini." });
    }

    const results = [];
    const errors = [];

    // 4. Proses setiap ikan secara berurutan
    for (const fish of fishes) {
      try {
        // 5. Ambil storage_path dari tabel images
        const { data: images, error: imgErr } = await supabase
          .from("images")
          .select("id, storage_path, mime_type")
          .in("id", [fish.eye_image_id, fish.gill_image_id]);

        if (imgErr) throw imgErr;

        const eyeImg = images.find((img) => img.id === fish.eye_image_id);
        const gillImg = images.find((img) => img.id === fish.gill_image_id);

        if (!eyeImg || !gillImg) {
          throw new Error(
            `Gambar untuk ikan #${fish.fish_index} tidak ditemukan.`,
          );
        }

        // 6. Download gambar dari Supabase Storage
        const [eyeDownload, gillDownload] = await Promise.all([
          supabase.storage.from("images").download(eyeImg.storage_path),
          supabase.storage.from("images").download(gillImg.storage_path),
        ]);

        if (eyeDownload.error)
          throw new Error(
            "Gagal download foto mata: " + eyeDownload.error.message,
          );
        if (gillDownload.error)
          throw new Error(
            "Gagal download foto insang: " + gillDownload.error.message,
          );

        // 7. Convert Blob ke Buffer
        const eyeBuffer = Buffer.from(await eyeDownload.data.arrayBuffer());
        const gillBuffer = Buffer.from(await gillDownload.data.arrayBuffer());

        // 8. Kirim ke model AI
        const prediction = await predictFishQuality(
          eyeBuffer,
          eyeImg.mime_type,
          gillBuffer,
          gillImg.mime_type,
        );

        // 9. Normalisasi confidence score ke 0-1
        const rawAvg =
          (prediction.mata.confidence + prediction.insang.confidence) / 2;
        const dbConfidenceAvg = rawAvg > 1 ? rawAvg / 100 : rawAvg;
        const dbEyeConfidence =
          prediction.mata.confidence > 1
            ? prediction.mata.confidence / 100
            : prediction.mata.confidence;
        const dbGillConfidence =
          prediction.insang.confidence > 1
            ? prediction.insang.confidence / 100
            : prediction.insang.confidence;

        // 10. Simpan hasil ke prediction_results
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

        // 11. Update status ikan jadi done
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

        // Tandai ikan gagal
        await supabase
          .from("fishes")
          .update({ status: "failed" })
          .eq("id", fish.id);

        errors.push({
          fish_id: fish.id,
          fish_index: fish.fish_index,
          error: fishErr.message,
        });
      }
    }

    // 12. Update status batch setelah semua ikan selesai diproses
    const allFailed = results.length === 0;

    const { data: batchUpdate, error: batchErr } = await supabase
      .from("batches")
      .update({
        status: allFailed ? "failed" : "done",
        preprocessed_status: allFailed ? "rejected" : "saved",
      })
      .eq("id", batch_id)
      .select();

    console.log("[predict] batch update result:", batchUpdate);
    if (batchErr) console.error("[predict] batch update error:", batchErr);

    res.status(allFailed ? 500 : 201).json({
      success: !allFailed,
      batch_id: batch_id,
      total: fishes.length,
      success_count: results.length,
      fail_count: errors.length,
      results,
      ...(errors.length > 0 && { errors }),
    });
  } catch (err) {
    console.error("[upload/predict]", err.message);

    // Jika terjadi error fatal di luar loop, pastikan status batch diubah ke failed/rejected
    await supabase
      .from("batches")
      .update({
        status: "failed",
        preprocessed_status: "rejected",
      })
      .eq("id", batch_id);

    res.status(500).json({ error: err.message });
  }
});

export default router;