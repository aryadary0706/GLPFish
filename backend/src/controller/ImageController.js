import { uploadFishImages } from "../services/UploadImages.js";
import { retakeFishImages } from "../services/RetakeFish.js";

export const replaceFishImages = async (req, res) => {
  try {
    const { fish_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Akses ditolak. User tidak terautentikasi." });
    }

    const result = await retakeFishImages(userId, fish_id, req.files);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[upload/replace] Error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Terjadi kesalahan saat retake foto." });
  }
};

export const uploadImages = async (req, res) => {
  try {
    const { batch_id } = req.body;
    
    // Mengambil userId dari middleware auth (req.user)
    const userId = req.user?.id;

    // ==========================================
    // 1. VALIDASI DATA DARI FRONTEND
    // ==========================================
    if (!req.files?.eye) {
      return res.status(400).json({ error: "File 'eye' (foto mata ikan) wajib dikirim." });
    }
    
    if (!req.files?.gill) {
      return res.status(400).json({ error: "File 'gill' (foto insang ikan) wajib dikirim." });
    }
    
    if (!batch_id) {
      return res.status(400).json({ error: "batch_id wajib disertakan." });
    }
    
    if (!userId) {
      return res.status(401).json({ error: "Akses ditolak. User tidak terautentikasi." });
    }

    // ==========================================
    // 2. PROSES UPLOAD MENGGUNAKAN SERVICE
    // ==========================================
    const result = await uploadFishImages(userId, batch_id, req.files);
    
    // ==========================================
    // 3. KEMBALIKAN RESPONS SUKSES
    // ==========================================
    return res.status(201).json(result);

  } catch (err) {
    console.error("[upload/images] Error:", err.message);
    return res.status(500).json({ 
      error: err.message || "Terjadi kesalahan internal saat menyimpan gambar." 
    });
  }
};