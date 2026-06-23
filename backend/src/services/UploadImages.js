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

// Helper function untuk hapus single fish + images nya
const deleteSingleFishAndImages = async (fishId, eyeImageId, gillImageId, eyePath, gillPath) => {
  try {
    // 1. Hapus dari storage
    const pathsToDelete = [];
    if (eyePath) pathsToDelete.push(eyePath);
    if (gillPath) pathsToDelete.push(gillPath);
    
    if (pathsToDelete.length > 0) {
      await supabase.storage.from("images").remove(pathsToDelete);
    }

    // 2. Hapus image records dari DB
    const imageIds = [];
    if (eyeImageId) imageIds.push(eyeImageId);
    if (gillImageId) imageIds.push(gillImageId);
    
    if (imageIds.length > 0) {
      await supabase.from("images").delete().in("id", imageIds);
    }

    // 3. Hapus fish record
    if (fishId) {
      await supabase.from("fishes").delete().eq("id", fishId);
    }

    console.log(`[rollback] Berhasil hapus fish ${fishId} dan images nya`);
  } catch (error) {
    console.error(`[rollback] Error saat hapus fish ${fishId}:`, error.message);
  }
};

// Cleanup function untuk menghapus semua images jika prediction gagal
export const cleanupBatchImages = async (batchId) => {
  try {
    // 1. Ambil semua images yang terkait dengan batch ini
    const { data: fishes, error: fishErr } = await supabase
      .from("fishes")
      .select("id, eye_image_id, gill_image_id")
      .eq("batch_id", batchId);

    if (fishErr) throw fishErr;

    if (!fishes || fishes.length === 0) return { success: true, deletedCount: 0 };

    // 2. Kumpulkan semua image IDs
    const imageIds = new Set();
    fishes.forEach(fish => {
      if (fish.eye_image_id) imageIds.add(fish.eye_image_id);
      if (fish.gill_image_id) imageIds.add(fish.gill_image_id);
    });

    const imageIdArray = Array.from(imageIds);
    if (imageIdArray.length === 0) return { success: true, deletedCount: 0 };

    // 3. Ambil storage paths dari images
    const { data: images, error: imgErr } = await supabase
      .from("images")
      .select("id, storage_path")
      .in("id", imageIdArray);

    if (imgErr) throw imgErr;

    // 4. Hapus dari storage
    for (const image of images || []) {
      if (image.storage_path) {
        await supabase.storage.from("images").remove([image.storage_path]);
      }
    }

    // 5. Hapus records dari database images
    const { error: deleteImgErr } = await supabase
      .from("images")
      .delete()
      .in("id", imageIdArray);

    if (deleteImgErr) throw deleteImgErr;

    // 6. Hapus records dari fishes
    const { error: deleteFishErr } = await supabase
      .from("fishes")
      .delete()
      .eq("batch_id", batchId);

    if (deleteFishErr) throw deleteFishErr;

    console.log(`[cleanup] Berhasil hapus ${imageIdArray.length} images untuk batch ${batchId}`);
    return { success: true, deletedCount: imageIdArray.length };
  } catch (error) {
    console.error(`[cleanup] Error hapus images batch ${batchId}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const uploadFishImages = async (userId, batchId, files) => {
  let uploadedPaths = [];
  let createdImageIds = [];
  let createdFishId = null;

  try {
    const eyeFile = files.eye[0];
    const gillFile = files.gill[0];
    const timestamp = Date.now();

    // ─── PRECHECK: status batch & kapasitas ───
    // Tolak kalau batch sudah saved/rejected (Bug #4 fix).
    // Tolak kalau jumlah ikan sudah mencapai fish_count (Bug #5 fix).
    const { data: batchPre, error: batchPreErr } = await supabase
      .from("batches")
      .select("preprocessed_status, fish_count")
      .eq("id", batchId)
      .single();

    if (batchPreErr || !batchPre) {
      throw { status: 404, message: "Batch tidak ditemukan." };
    }
    if (batchPre.preprocessed_status === "saved" || batchPre.preprocessed_status === "rejected") {
      throw {
        status: 400,
        message: `Batch sudah ${batchPre.preprocessed_status === "saved" ? "disimpan final" : "ditolak"}, tidak bisa menambah ikan.`,
      };
    }

    const { count: currentCount, error: countPreErr } = await supabase
      .from("fishes")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);

    if (countPreErr) throw countPreErr;
    if (batchPre.fish_count && currentCount >= batchPre.fish_count) {
      throw {
        status: 400,
        message: `Batch sudah penuh (${currentCount}/${batchPre.fish_count} ikan). Tidak bisa menambah lagi.`,
      };
    }

    const eyePath = `${userId}/${batchId}/${timestamp}_eye${_ext(eyeFile.mimetype)}`;
    const gillPath = `${userId}/${batchId}/${timestamp}_gill${_ext(gillFile.mimetype)}`;

    // 1. Upload ke Storage tetap pakai path yang unik
    const [eyeUpload, gillUpload] = await Promise.all([
      supabase.storage.from("images").upload(eyePath, eyeFile.buffer, {
        contentType: eyeFile.mimetype,
        upsert: false,
      }),
      supabase.storage.from("images").upload(gillPath, gillFile.buffer, {
        contentType: gillFile.mimetype,
        upsert: false,
      }),
    ]);

    if (eyeUpload.error)
      throw new Error("Gagal upload foto mata: " + eyeUpload.error.message);
    if (gillUpload.error)
      throw new Error("Gagal upload foto insang: " + gillUpload.error.message);

    // Track paths yang berhasil terupload
    uploadedPaths.push(eyeUpload.data.path, gillUpload.data.path);

    const { count, error: countErr } = await supabase
      .from("fishes")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);

    if (countErr) throw countErr;
    const fishIndex = (count || 0) + 1;

    const newEyesName = `Eyes_Batch-${batchId}_Fish-${fishIndex}_${eyeFile.originalname}`;
    const newGillName = `Gill_Batch-${batchId}_Fish-${fishIndex}_${gillFile.originalname}`;

    const [eyeImgResult, gillImgResult] = await Promise.all([
      supabase
        .from("images")
        .insert({
          user_id: userId,
          file_name: newEyesName,
          storage_path: eyeUpload.data.path,
          mime_type: eyeFile.mimetype,
          file_size: eyeFile.size,
        })
        .select()
        .single(),
      supabase
        .from("images")
        .insert({
          user_id: userId,
          file_name: newGillName,
          storage_path: gillUpload.data.path,
          mime_type: gillFile.mimetype,
          file_size: gillFile.size,
        })
        .select()
        .single(),
    ]);

    if (eyeImgResult.error) throw eyeImgResult.error;
    if (gillImgResult.error) throw gillImgResult.error;

    // Track image records yang berhasil dibuat
    createdImageIds.push(eyeImgResult.data.id, gillImgResult.data.id);

    // 5. Insert ke tabel fishes
    const { data: fishRow, error: fishErr } = await supabase
      .from("fishes")
      .insert({
        batch_id: batchId,
        fish_index: fishIndex,
        eye_image_id: eyeImgResult.data.id,
        gill_image_id: gillImgResult.data.id,
        status: "pending",
      })
      .select()
      .single();

    if (fishErr) throw fishErr;

    createdFishId = fishRow.id;

    let preprocessedStatus = "incomplete";
    const { data: batch } = await supabase
      .from("batches")
      .select("fish_count")
      .eq("id", batchId)
      .single();

    if (batch && fishIndex >= batch.fish_count) {
      await supabase
        .from("batches")
        .update({ preprocessed_status: "completed" })
        .eq("id", batchId);

      preprocessedStatus = "completed";
    }

    // ──────────────────────────────────────────────────────────────
    // PREDIKSI LANGSUNG (best-effort, tidak boleh batalkan upload).
    // Kalau model healthy → simpan grade & set fish.status='done'.
    // Kalau gagal → fish biarkan 'pending', final /predict yang handle.
    // ──────────────────────────────────────────────────────────────
    let predictionPayload = null;
    try {
      const modelReady = await checkModelHealth({ retries: 1, timeoutMs: 5000 });
      if (modelReady) {
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
            fish_id: fishRow.id,
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
          .eq("id", fishRow.id);

        predictionPayload = {
          grade: prediction.grade,
          confidence: dbConfidenceAvg,
        };
      } else {
        console.warn(`[upload] Model belum siap, ikan #${fishIndex} dibiarkan pending`);
      }
    } catch (predErr) {
      console.error(`[upload] Prediksi instan ikan #${fishIndex} gagal:`, predErr.message);
      // Sengaja swallow — upload tetap dianggap sukses.
    }

    return {
      success: true,
      fish_id: fishRow.id,
      fish_index: fishIndex,
      batch_id: batchId,
      preprocessed_status: preprocessedStatus,
      images: {
        eye: { id: eyeImgResult.data.id, path: eyeUpload.data.path },
        gill: { id: gillImgResult.data.id, path: gillUpload.data.path },
      },
      prediction: predictionPayload,
    };
  } catch (error) {
    // ROLLBACK: Jika ada error, hapus semua yang sudah dibuat
    console.error(`[upload] Error upload images batch ${batchId}:`, error.message);
    
    try {
      // Hapus fish record jika sudah dibuat
      if (createdFishId) {
        await supabase.from("fishes").delete().eq("id", createdFishId);
        console.log(`[rollback] Hapus fish record ${createdFishId}`);
      }

      // Hapus image records jika sudah dibuat
      if (createdImageIds.length > 0) {
        await supabase.from("images").delete().in("id", createdImageIds);
        console.log(`[rollback] Hapus ${createdImageIds.length} image records`);
      }

      // Hapus files dari storage
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("images").remove(uploadedPaths);
        console.log(`[rollback] Hapus ${uploadedPaths.length} files dari storage`);
      }

      console.log(`[rollback] Sempurna! Upload untuk batch ${batchId} di-rollback sepenuhnya`);
    } catch (cleanupError) {
      console.error(`[rollback] Error saat cleanup:`, cleanupError.message);
    }

    throw error;
  }
};