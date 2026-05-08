import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ─── GET /me ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users') 
    .select('id, name, email, role, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ error: 'User tidak ditemukan' })

  res.json({ user: data })
})

// ─── PUT /update (nama) ───────────────────────────────────
router.put('/update', requireAuth, async (req, res) => {
  const { name } = req.body

  // Validasi input
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nama tidak boleh kosong' })
  }

  const { data, error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', req.user.id)
    .select('id, name, email, role, created_at')  
    .single()             // ganti .single() → .select() untuk update

  if (error) return res.status(500).json({ error: 'Gagal update profil' })

  res.json({ message: 'Profil berhasil diupdate', user: data })
})



export default router