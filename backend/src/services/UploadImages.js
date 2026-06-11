import { supabase } from "../lib/supabase.js";

function _ext(mimetype) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mimetype] ?? ".jpg";
}

export const uploadFishImages = async (userId, batchId, files) => {
  const eyeFile = files.eye[0];
  const gillFile = files.gill[0];
  const timestamp = Date.now();

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
  };
};