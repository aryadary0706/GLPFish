import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Format file '${file.fieldname}' tidak didukung. Gunakan JPG, PNG, atau WEBP.`,
      ),
      false,
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

function _ext(mimetype) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mimetype] ?? ".jpg";
}

// Error handler khusus multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `Ukuran file '${err.field}' terlalu besar. Maksimal 5MB.`,
      });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes("tidak didukung")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ─────────────────────────────────────────────────────────────
// POST /api/upload/images
// Upload foto mata + insang, simpan ke storage & DB tanpa prediksi
// ─────────────────────────────────────────────────────────────
router.post(
  "/images",
  requireAuth,
  upload.fields([
    { name: "eye", maxCount: 1 },
    { name: "gill", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { batch_id } = req.body;
      const userId = req.user.id;

      if (!req.files?.eye) {
        return res
          .status(400)
          .json({ error: "File 'eye' (foto mata ikan) wajib dikirim." });
      }
      if (!req.files?.gill) {
        return res
          .status(400)
          .json({ error: "File 'gill' (foto insang ikan) wajib dikirim." });
      }
      if (!batch_id) {
        return res.status(400).json({ error: "batch_id wajib disertakan." });
      }

      const eyeFile = req.files.eye[0];
      const gillFile = req.files.gill[0];
      const timestamp = Date.now();

      const eyePath = `${userId}/${batch_id}/${timestamp}_eye${_ext(eyeFile.mimetype)}`;
      const gillPath = `${userId}/${batch_id}/${timestamp}_gill${_ext(gillFile.mimetype)}`;

      // Upload paralel ke storage
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

      // Simpan metadata ke tabel images
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

      // Hitung fish_index berdasarkan jumlah fishes yang sudah ada
      const { count, error: countErr } = await supabase
        .from("fishes")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batch_id);

      if (countErr) throw countErr;
      const fishIndex = (count || 0) + 1;

      // Simpan ke tabel fishes dengan status pending
      const { data: fishRow, error: fishErr } = await supabase
        .from("fishes")
        .insert({
          batch_id: batch_id,
          fish_index: fishIndex,
          eye_image_id: eyeImgResult.data.id,
          gill_image_id: gillImgResult.data.id,
          status: "pending",
        })
        .select()
        .single();

      if (fishErr) throw fishErr;

      // Cek apakah jumlah fishes sudah sama dengan fish_count di batch
      let preprocessed_status = "incomplete";

      const { count: fishCount, error: countCheckErr } = await supabase
        .from("fishes")
        .select("*", { count: "exact", head: true })
        .eq("batch_id", batch_id);

      if (!countCheckErr) {
        const { data: batch } = await supabase
          .from("batches")
          .select("fish_count")
          .eq("id", batch_id)
          .single();

        if (batch && fishCount >= batch.fish_count) {
          await supabase
            .from("batches")
            .update({ preprocessed_status: "completed" })
            .eq("id", batch_id);

          preprocessed_status = "completed";
        }
      }

      res.status(201).json({
        success: true,
        fish_id: fishRow.id,
        fish_index: fishIndex,
        batch_id: batch_id,
        preprocessed_status,
        images: {
          eye: { id: eyeImgResult.data.id, path: eyeUpload.data.path },
          gill: { id: gillImgResult.data.id, path: gillUpload.data.path },
        },
      });
    } catch (err) {
      console.error("[upload/images]", err.message);
      res.status(500).json({ error: err.message });
    }
  },
);



export default router;