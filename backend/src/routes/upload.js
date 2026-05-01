// src/routes/upload.js
import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'
import { checkModelHealth, predictFishQuality } from '../lib/model.js'

const router = Router()

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Format file '${file.fieldname}' tidak didukung. Gunakan JPG, PNG, atau WEBP.`), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB sesuai docs API model
  fileFilter,
})

// ─────────────────────────────────────────────────────────────
// POST /api/upload/images
// Upload foto biasa (tanpa prediksi) — untuk keperluan lain
// ─────────────────────────────────────────────────────────────
router.post(
  '/images',
  requireAuth,
  upload.array('files', 10),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' })
    }

    const user    = req.user
    const results = []
    const errors  = []

    await Promise.all(
      req.files.map(async (file) => {
        try {
          const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
          const filePath = `${user.id}/${fileName}`

          const { data: storageData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { data: imageRow, error: dbError } = await supabase
            .from('images')
            .insert({
              user_id:      user.id,
              storage_path: storageData.path,
              file_name:    file.originalname,
              mime_type:    file.mimetype,
              file_size:    file.size,
            })
            .select()
            .single()

          if (dbError) throw dbError

          results.push(imageRow)
        } catch (err) {
          console.error(`[upload] ${file.originalname}:`, err.message)
          errors.push({ file: file.originalname, error: err.message })
        }
      })
    )

    if (results.length === 0) {
      return res.status(500).json({ error: 'Semua file gagal diunggah.', errors })
    }

    res.json({
      message:       `${results.length} file berhasil diunggah`,
      success_count: results.length,
      fail_count:    errors.length,
      data:          results,
      ...(errors.length > 0 && { errors }),
    })
  }
)

// ─────────────────────────────────────────────────────────────
// POST /api/upload/predict
// Upload foto mata + insang → kirim ke model AI → simpan hasil
// ─────────────────────────────────────────────────────────────
router.post(
  '/predict',
  requireAuth,
  upload.fields([
    { name: 'eye',  maxCount: 1 },
    { name: 'gill', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 1. Validasi kedua file wajib ada
      if (!req.files?.eye) {
        return res.status(400).json({ error: "File 'eye' (foto mata ikan) wajib dikirim." })
      }
      if (!req.files?.gill) {
        return res.status(400).json({ error: "File 'gill' (foto insang ikan) wajib dikirim." })
      }

      const eyeFile  = req.files.eye[0]
      const gillFile = req.files.gill[0]
      const user     = req.user

      // 2. Cek model server siap
      const modelReady = await checkModelHealth()
      if (!modelReady) {
        return res.status(503).json({ error: 'Model server tidak tersedia, coba beberapa saat lagi.' })
      }

      // 3. Upload kedua foto ke Supabase Storage bucket 'images'
      const timestamp = Date.now()
      const eyePath   = `${user.id}/${timestamp}_eye${_ext(eyeFile.mimetype)}`
      const gillPath  = `${user.id}/${timestamp}_gill${_ext(gillFile.mimetype)}`

      const [eyeUpload, gillUpload] = await Promise.all([
        supabase.storage.from('images').upload(eyePath, eyeFile.buffer, {
          contentType: eyeFile.mimetype,
          upsert: false,
        }),
        supabase.storage.from('images').upload(gillPath, gillFile.buffer, {
          contentType: gillFile.mimetype,
          upsert: false,
        }),
      ])

      if (eyeUpload.error)  throw new Error('Gagal upload foto mata: '   + eyeUpload.error.message)
      if (gillUpload.error) throw new Error('Gagal upload foto insang: ' + gillUpload.error.message)

      // 4. Simpan metadata foto ke tabel 'images'
      //    Simpan path eye sebagai referensi utama, gill disimpan di kolom storage_path_gill
      const { data: imageRow, error: imageError } = await supabase
        .from('images')
        .insert({
          user_id:           user.id,
          file_name:         eyeFile.originalname,
          storage_path:      eyeUpload.data.path,
          storage_path_gill: gillUpload.data.path,   // kolom tambahan, lihat catatan di bawah
          mime_type:         eyeFile.mimetype,
          file_size:         eyeFile.size,
        })
        .select()
        .single()

      if (imageError) throw imageError

      // 5. Kirim buffer foto ke FastAPI → dapat hasil prediksi
      //    (pakai buffer dari memory, tidak perlu download ulang dari storage)
      const prediction = await predictFishQuality(
        eyeFile.buffer,  eyeFile.mimetype,
        gillFile.buffer, gillFile.mimetype,
      )

      // 6. Simpan hasil prediksi ke tabel 'prediction_results'
      const avgConfidence = (prediction.mata.confidence + prediction.insang.confidence) / 2

      const { error: predError } = await supabase
        .from('prediction_results')
        .insert({
          image_id:          imageRow.id,
          // Kolom lama (tetap diisi agar tidak breaking)
          confidence_score:  avgConfidence,
          // Kolom tambahan hasil ALTER TABLE
          grade:             prediction.grade,
          label_text:        prediction.label,
          warna:             prediction.warna,
          exportable:      prediction.layak_ekspor,
          eyes_status:       prediction.mata.status,
          eyes_confidence_score:   prediction.mata.confidence,
          gill_status:     prediction.insang.status,
          gill_confidence_score: prediction.insang.confidence,
          waktu_proses_ms:   prediction.waktu_proses_ms,
        })

      if (predError) throw predError

      // 7. Return hasil lengkap ke frontend
      res.status(201).json({
        success:    true,
        image_id:   imageRow.id,
        prediction,
      })

    } catch (err) {
      console.error('[upload/predict]', err.message)
      res.status(500).json({ error: err.message })
    }
  }
)

// ─────────────────────────────────────────────────────────────
// Error handler multer (ukuran file, format tidak didukung)
// ─────────────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `Ukuran file '${err.field}' terlalu besar. Maksimal 10MB.` })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.message?.includes('tidak didukung')) {
    return res.status(400).json({ error: err.message })
  }
  next(err)
})

// Helper: ekstensi dari mimetype
function _ext(mimetype) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
  return map[mimetype] ?? '.jpg'
}

export default router