import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/inspections — ambil semua gambar milik user beserta hasil prediksi
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
          label,
          confidence_score,
          predicted_at
        )
      `)
      .eq('user_id', req.user.id)
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    res.json({ inspections: data })
  } catch (err) {
    console.error('[inspections]', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router