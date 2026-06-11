import { uploadFishImages } from "../services/UploadImages.js";

export const uploadImages = async (req, res) => {
  try {
    const { batch_id } = req.body;
    const userId = req.user.id;

    if (!req.files?.eye) {
      return res.status(400).json({ error: "File 'eye' (foto mata ikan) wajib dikirim." });
    }
    if (!req.files?.gill) {
      return res.status(400).json({ error: "File 'gill' (foto insang ikan) wajib dikirim." });
    }
    if (!batch_id) {
      return res.status(400).json({ error: "batch_id wajib disertakan." });
    }

    const result = await inspectionService.uploadFishImages(userId, batch_id, req.files);
    return res.status(201).json(result);
  } catch (err) {
    console.error("[upload/images]", err.message);
    return res.status(500).json({ error: err.message });
  }
};