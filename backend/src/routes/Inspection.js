import { Router } from "express";
import multer from "multer";

import { requireAdmin, requireAuth, requireBatchOwner } from "../middleware/auth.js";
import { uploadImages, replaceFishImages } from "../controller/ImageController.js";
import { getInspectionDetails, getInspections, predictBatch } from "../controller/InspectionController.js";

const router = Router();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file '${file.fieldname}' tidak didukung. Gunakan JPG, PNG, atau WEBP.`), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

const uploadMiddleware = upload.fields([
  { name: 'eye', maxCount: 1 },
  { name: 'gill', maxCount: 1 }
]);

// ==========================================
// 3. RUTE-RUTE API
// ==========================================

// Rute upload gambar kita (WAJIB '/images' agar sesuai dengan Frontend)
router.post("/images", requireAuth, uploadMiddleware, requireBatchOwner, uploadImages);

// Rute retake (replace foto ikan + re-predict otomatis)
// Ownership cek lewat fish_id (requireBatchOwner resolve ke batch_id otomatis)
router.post("/replace", requireAuth, uploadMiddleware, requireBatchOwner, replaceFishImages);

// Rute fitur lain
router.post("/predict", requireAuth, requireBatchOwner, predictBatch);
router.get("/", requireAuth, requireAdmin, getInspections);
router.get("/:id", requireAuth, requireAdmin, getInspectionDetails);

// ==========================================
// 4. ERROR HANDLER KHUSUS MULTER
// ==========================================
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: `Ukuran file '${err.field}' terlalu besar. Maksimal 10MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes("tidak didukung")) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
});

export default router;