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
    cb(new Error('Format file tidak didukung. Gunakan PNG, JPG, atau WEBP.'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
})

router.post(
  '/images',
  requireAuth,
  upload.array('files', 10),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' })
    }

    const user    = req.user
    const results = []
    const errors  = []

    await Promise.all(
      req.files.map(async (file) => {
        try {
          const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
          const filePath = `${user.id}/${fileName}`

          // 1. Upload ke Supabase Storage bucket 'images'
          const { data: storageData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            })

          if (uploadError) throw uploadError

          // 2. Simpan metadata ke tabel 'images'
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
      return res.status(500).json({
        error: 'Semua file gagal diunggah.',
        errors,
      })
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

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('Format file')) {
    return res.status(400).json({ error: err.message })
  }
  next(err)
})

export default router