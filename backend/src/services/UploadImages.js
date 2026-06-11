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

  const [eyeImgResult, gillImgResult] = await Promise.all([
    supabase
      .from("images")
      .insert({
        user_id: userId,
        file_name: eyeFile.originalname,
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
        file_name: gillFile.originalname,
        storage_path: gillUpload.data.path,
        mime_type: gillFile.mimetype,
        file_size: gillFile.size,
      })
      .select()
      .single(),
  ]);

  if (eyeImgResult.error) throw eyeImgResult.error;
  if (gillImgResult.error) throw gillImgResult.error;

  const { count, error: countErr } = await supabase
    .from("fishes")
    .select("*", { count: "exact", head: true })
    .eq("batch_id", batchId);

  if (countErr) throw countErr;
  const fishIndex = (count || 0) + 1;

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
  const { count: fishCount, error: countCheckErr } = await supabase
    .from("fishes")
    .select("*", { count: "exact", head: true })
    .eq("batch_id", batchId);

  if (!countCheckErr) {
    const { data: batch } = await supabase
      .from("batches")
      .select("fish_count")
      .eq("id", batchId)
      .single();

    if (batch && fishCount >= batch.fish_count) {
      await supabase
        .from("batches")
        .update({ preprocessed_status: "completed" })
        .eq("id", batchId);

      preprocessedStatus = "completed";
    }
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
