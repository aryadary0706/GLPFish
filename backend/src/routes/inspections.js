// Aku lupa kalau ini perlu atau kagak ;v

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/inspections
// Ambil semua riwayat inspeksi (dari DB, tidak call model)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub

    let query = supabase
      .from('images')
      .select(`
        id,
        file_name,
        storage_path,
        uploaded_at,
        user_id,
        fishes!inner (
          prediction_results!inner (
            grade,
            label_text,
            exportable,
            confidence_score,
            eyes_status,
            eyes_confidence_score,
            gill_status,
            gill_confidence_score,
            predicted_at
          )
        )
      `)
      .order('uploaded_at', { ascending: false })

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error

    const formattedInspections = data.map((img) => {
      const pred = img.fishes?.[0]?.prediction_results?.[0] || null

      return {
        id: img.id,
        file_name: img.file_name,
        storage_path: img.storage_path,
        uploaded_at: img.uploaded_at,
        prediction_results: pred ? {
          grade: pred.grade,
          label_text: pred.label_text,
          warna: pred.warna || "",
          exportable: pred.exportable,
          confidence_score: pred.confidence_score ? Math.round(pred.confidence_score * 100) : 0, // Mengembalikan ke skala 0-100
          eyes_status: pred.eyes_status,
          eyes_confidence_score: pred.eyes_confidence_score ? Math.round(pred.eyes_confidence_score * 100) : 0,
          gill_status: pred.gill_status,
          gill_confidence_score: pred.gill_confidence_score ? Math.round(pred.gill_confidence_score * 100) : 0,
          predicted_at: pred.predicted_at
        } : null
      }
    }).filter(item => item.prediction_results !== null) // Memastikan hanya data yang berhasil di-predict yang keluar

    res.json({ inspections: formattedInspections })
  } catch (err) {
    console.error('[GET /api/inspections] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/inspections/:id
// Ambil detail satu inspeksi berdasarkan image_id (Mata)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub

    let query = supabase
      .from('images')
      .select(`
        id,
        file_name,
        storage_path,
        uploaded_at,
        user_id,
        fishes!inner (
          gill_image:images (
            storage_path
          ),
          prediction_results!inner (
            grade,
            label_text,
            exportable,
            confidence_score,
            eyes_status,
            eyes_confidence_score,
            gill_status,
            gill_confidence_score,
            waktu_proses_ms,
            predicted_at
          )
        )
      `)
      .eq('id', req.params.id)

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', userId)
    }

    const { data: imgRow, error } = await query.maybeSingle()

    if (error) throw error
    if (!imgRow) {
      return res.status(404).json({ error: 'Inspeksi tidak ditemukan atau Anda tidak memiliki akses.' })
    }

    const fishData = imgRow.fishes?.[0]
    const predData = fishData?.prediction_results?.[0]
  
    const storagePathGill = fishData?.gill_image?.storage_path || null

    const responseData = {
      id: imgRow.id,
      file_name: imgRow.file_name,
      storage_path: imgRow.storage_path,
      storage_path_gill: storagePathGill,
      uploaded_at: imgRow.uploaded_at,
      prediction_results: predData ? {
        grade: predData.grade,
        label_text: predData.label_text,
        warna: predData.warna || "", 
        exportable: predData.exportable,
        confidence_score: predData.confidence_score ? Math.round(predData.confidence_score * 100) : 0,
        eyes_status: predData.eyes_status,
        eyes_confidence_score: predData.eyes_confidence_score ? Math.round(predData.eyes_confidence_score * 100) : 0,
        gill_status: predData.gill_status,
        gill_confidence_score: predData.gill_confidence_score ? Math.round(predData.gill_confidence_score * 100) : 0,
        waktu_proses_ms: predData.waktu_proses_ms || 0,
        raw_output: predData.raw_output || {},
        predicted_at: predData.predicted_at
      } : null
    }

    res.json({ inspection: responseData })
  } catch (err) {
    console.error('[GET /api/inspections/:id] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router