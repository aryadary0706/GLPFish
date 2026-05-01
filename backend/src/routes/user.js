import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ─── GET /me ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')       // konsisten pakai 'profiles'
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error) {
    console.error('Supabase Error:', error)
    return res.status(404).json({ error: 'Profil tidak ditemukan' })
  }

  res.json({
    user: {
      ...req.user,
      profile: data,
    },
  })
})

// ─── PUT /update (nama) ───────────────────────────────────
router.put('/update', requireAuth, async (req, res) => {
  const { name } = req.body

  // Validasi input
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Nama tidak boleh kosong' })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ name: name.trim() })
    .eq('id', req.user.id)
    .select()               // ganti .single() → .select() untuk update

  if (error) {
    console.error('Supabase Error:', error)
    return res.status(500).json({ error: 'Gagal update profil' })
  }

  res.json({
    message: 'Profil berhasil diupdate',
    profile: data[0],
  })
})

// ─── PUT /update/password ─────────────────────────────────
router.put('/update/password', requireAuth, async (req, res) => {
  const { password } = req.body

  // Validasi input
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password minimal 8 karakter' })
  }

  // ✅ Password harus lewat Supabase Auth Admin, bukan update tabel
  const { error } = await supabase.auth.admin.updateUserById(
    req.user.id,
    { password }
  )

  if (error) {
    console.error('Supabase Auth Error:', error)
    return res.status(500).json({ error: 'Gagal update password' })
  }

  res.json({ message: 'Password berhasil diupdate' })
})

export default router