// src/routes/inspections.js
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ─────────────────────────────────────────────────────────────
// GET /api/inspections
// Ambil semua riwayat inspeksi milik user (dari DB, tidak call model)
// ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('images')
      .select(`
        id,
        file_name,
        storage_path,
        uploaded_at,
        prediction_results (
          grade,
          label_text,
          warna,
          exportable,
          confidence_score,
          eyes_status,
          eyes_confidence_score,
          gill_status,
          gill_confidence_score,
          predicted_at
        )
      `)
      .eq('user_id', req.user.id)
      .not('prediction_results', 'is', null)  
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    res.json({ inspections: data })
  } catch (err) {
    console.error('[inspections]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// GET /api/inspections/:id
// Ambil detail satu inspeksi berdasarkan image_id
// ─────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('images')
      .select(`
        id,
        file_name,
        storage_path,
        storage_path_gill,
        uploaded_at,
        prediction_results (
          grade,
          label_text,
          warna,
          exportable,
          confidence_score,
          eyes_status,
          eyes_confidence_score,
          gill_status,
          gill_confidence_score,
          waktu_proses_ms,
          raw_output,
          predicted_at
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)   // pastikan hanya bisa akses milik sendiri
      .single()

    if (error) {
      // Supabase return error jika row tidak ditemukan
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Inspeksi tidak ditemukan.' })
      }
      throw error
    }

    res.json({ inspection: data })
  } catch (err) {
    console.error('[inspections/:id]', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router