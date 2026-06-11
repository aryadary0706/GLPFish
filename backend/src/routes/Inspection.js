import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import * as inspectionController from "../controller/InspectionController.js";
import { uploadImages } from "../controller/ImageController.js";
import { getInspectionDetails, getInspections, predictBatch } from "../controller/InspectionController.js";
import multer from "multer";

const router = Router();

// Filter file image yang diupload
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format file '${file.fieldname}' tidak didukung. Gunakan JPG, PNG, atau WEBP.`), false);
  }
};

// Helper untuk upload file (5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

router.use(requireAuth);

router.post(
  "/",
  upload.fields([
    { name: "eye", maxCount: 1 },
    { name: "gill", maxCount: 1 },
  ]),
  uploadImages
);
router.post("/predict", predictBatch);
router.get("/", requireAdmin, getInspections);
router.get("/:id", requireAdmin, getInspectionDetails);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: `Ukuran file '${err.field}' terlalu besar. Maksimal 5MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes("tidak didukung")) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
});

export default router;