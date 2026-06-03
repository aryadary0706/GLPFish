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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
})

// Helper: ekstensi dari mimetype
function _ext(mimetype) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
  return map[mimetype] ?? '.jpg'
}

// ─────────────────────────────────────────────────────────────
// POST /api/upload/predict
// Upload foto mata + insang → kirim ke model AI → simpan hasil
// ─────────────────────────────────────────────────────────────
router.post(
  '/predict',
  requireAuth,
  upload.fields([
    { name: 'eye', maxCount: 1 },
    { name: 'gill', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Ambil field teks batch_id dari request body FormData
      const { batch_id } = req.body
      const userId = req.user.id || req.user.sub

      // 1. Validasi masukan berkas
      if (!req.files?.eye) {
        return res.status(400).json({ error: "File 'eye' (foto mata ikan) wajib dikirim." })
      }
      if (!req.files?.gill) {
        return res.status(400).json({ error: "File 'gill' (foto insang ikan) wajib dikirim." })
      }
      if (!batch_id) {
        return res.status(400).json({ error: "batch_id wajib disertakan untuk melacak status ikan." })
      }

      const eyeFile = req.files.eye[0]
      const gillFile = req.files.gill[0]

      // 2. Cek kesiapan Server AI FastAPI
      const modelReady = await checkModelHealth()
      if (!modelReady) {
        return res.status(503).json({ error: 'Model server tidak tersedia, coba beberapa saat lagi.' })
      }

      // 3. Tentukan nama lokasi path biner di Supabase Storage
      const timestamp = Date.now()
      const eyePath = `${userId}/${timestamp}_eye${_ext(eyeFile.mimetype)}`
      const gillPath = `${userId}/${timestamp}_gill${_ext(gillFile.mimetype)}`

      // 4. Unggah paralel fisik file ke bucket storage
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

      if (eyeUpload.error) throw new Error('Gagal upload foto mata: ' + eyeUpload.error.message)
      if (gillUpload.error) throw new Error('Gagal upload foto insang: ' + gillUpload.error.message)

      // 5. Catat metadata mata ke tabel `images` (Baris 1)
      const { data: eyeImgRow, error: eyeImgErr } = await supabase
        .from('images')
        .insert({
          user_id: userId,
          file_name: eyeFile.originalname,
          storage_path: eyeUpload.data.path,
          mime_type: eyeFile.mimetype,
          file_size: eyeFile.size,
        })
        .select().single()

      if (eyeImgErr) throw eyeImgErr

      // 6. Catat metadata insang ke tabel `images` (Baris 2)
      const { data: gillImgRow, error: gillImgErr } = await supabase
        .from('images')
        .insert({
          user_id: userId,
          file_name: gillFile.originalname,
          storage_path: gillUpload.data.path,
          mime_type: gillFile.mimetype,
          file_size: gillFile.size,
        })
        .select().single()

      if (gillImgErr) throw gillImgErr

      // 7. Hitung kalkulasi kualitas ikan via FastAPI Model
      const prediction = await predictFishQuality(
        eyeFile.buffer, eyeFile.mimetype,
        gillFile.buffer, gillFile.mimetype,
      )

      // 8. Hitung indeks sekuensial fish_index dari database
      const { count, error: countErr } = await supabase
        .from('fishes')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batch_id)
      
      if (countErr) throw countErr
      const currentFishIndex = (count || 0) + 1

      // 9. Registrasikan satu entitas ikan baru ke tabel `fishes`
      const { data: fishRow, error: fishErr } = await supabase
        .from('fishes')
        .insert({
          batch_id: batch_id,
          fish_index: currentFishIndex,
          eye_image_id: eyeImgRow.id,
          gill_image_id: gillImgRow.id,
          status: 'done'
        })
        .select().single()

      if (fishErr) throw fishErr

      // 10. Normalisasi skor menjadi pecahan desimal (0 s.d 1) untuk Postgres CHECK constraint
      const rawAvg = (prediction.mata.confidence + prediction.insang.confidence) / 2
      const dbConfidenceAvg = rawAvg > 1 ? rawAvg / 100 : rawAvg
      const dbEyeConfidence = prediction.mata.confidence > 1 ? prediction.mata.confidence / 100 : prediction.mata.confidence
      const dbGillConfidence = prediction.insang.confidence > 1 ? prediction.insang.confidence / 100 : prediction.insang.confidence

      // 11. Masukkan hasil penilaian final ke tabel `prediction_results` (Berelasi ke fish_id)
      const { error: predError } = await supabase
        .from('prediction_results')
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
        })

      if (predError) throw predError

      // 12. Kembalikan response terstruktur ke frontend Axios-mu
      res.status(201).json({
        success: true,
        image_id: eyeImgRow.id,
        prediction,
      })

    } catch (err) {
      console.error('[upload/predict]', err.message)
      res.status(500).json({ error: err.message })
    }
  }
)

// Error handler khusus multer
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

export default router