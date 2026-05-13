import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'
import bcrypt from 'bcrypt'

const router = Router()

// ─── GET /me ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users') 
    .select('id, name, email, role, created_at')
    .eq('id', req.user.sub)
    .single()

    console.log('req.user:', req.user)
    console.log('supabase error:', error)

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
    .eq('id', req.user.sub)
    .select('id, name, email, role, created_at')  
    .single()

  if (error) return res.status(500).json({ error: 'Gagal update profil' })

  res.json({ message: 'Profil berhasil diupdate', user: data })
})

router.put('/update-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
 
  // Validasi input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Semua field password wajib diisi' })
  }
  if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' })
  }
 
  // Ambil password hash user saat ini dari DB
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('password')
    .eq('id', req.user.sub)
    .single()
 
  if (fetchError || !userData) {
    return res.status(404).json({ error: 'User tidak ditemukan' })
  }
 
  // Verifikator password lama
  const isMatch = await bcrypt.compare(currentPassword, userData.password)
  if (!isMatch) {
    return res.status(401).json({ error: 'Kata sandi lama tidak sesuai' })
  }
 
  // Condition: password baru tidak boleh sama dengan password lama
  const isSamePassword = await bcrypt.compare(newPassword, userData.password)
  if (isSamePassword) {
    return res.status(400).json({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini' })
  }
 
  // simpan password baru
  const newHash = await bcrypt.hash(newPassword, 10)
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: newHash })
    .eq('id', req.user.sub)
 
  if (updateError) return res.status(500).json({ error: 'Gagal update password' })
 
  res.json({ message: 'Kata sandi berhasil diperbarui' })
})



export default router