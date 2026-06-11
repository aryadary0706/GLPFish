import { uploadFishImages } from "../services/UploadImages.js";

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