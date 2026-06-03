import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

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

// ─────────────────────────────────────────────────────────────
// POST /api/upload/images
// Upload foto biasa (Array) — untuk keperluan umum/lainnya
// ─────────────────────────────────────────────────────────────
router.post(
  '/images',
  requireAuth,
  upload.array('files', 10),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' })
    }

    const userId = req.user.id || req.user.sub
    const results = []
    const errors = []

    await Promise.all(
      req.files.map(async (file) => {
        try {
          const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
          const filePath = `${userId}/${fileName}`

          const { data: storageData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            })

          if (uploadError) throw uploadError

          // Menyimpan entitas single image ke baris tabel images
          const { data: imageRow, error: dbError } = await supabase
            .from('images')
            .insert({
              user_id: userId,
              storage_path: storageData.path,
              file_name: file.originalname,
              mime_type: file.mimetype,
              file_size: file.size,
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
      message: `${results.length} file berhasil diunggah`,
      success_count: results.length,
      fail_count: errors.length,
      data: results,
      ...(errors.length > 0 && { errors }),
    })
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