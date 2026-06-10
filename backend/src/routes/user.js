import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'
import bcrypt from 'bcrypt'

const router = Router()

// GET /me
// Ambil data user yang login saat ini 
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users') 
    .select('id, name, email, role, created_at')
    .eq('id', req.user.id)
    .single()
  if (error) return res.status(404).json({ error: 'User tidak ditemukan' })

  res.json({ user: data })
})

// PUT /update
// Melakukan update pada nama (string)
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
    .single()

  if (error) return res.status(500).json({ error: 'Gagal update profil' })

  res.json({ message: 'Profil berhasil diupdate', user: data })
})

// PUT /update-password
// Melakukan update pada password (string)
router.put('/update-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body
 
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Semua field password wajib diisi' })
  }
  if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter' })
  }
 
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('password')
    .eq('id', req.user.id)
    .single()
 
  if (fetchError || !userData) {
    return res.status(404).json({ error: 'User tidak ditemukan' })
  }
 
  const isMatch = await bcrypt.compare(currentPassword, userData.password)
  if (!isMatch) {
    return res.status(401).json({ error: 'Kata sandi lama tidak sesuai' })
  }
 
  const isSamePassword = await bcrypt.compare(newPassword, userData.password)
  if (isSamePassword) {
    return res.status(400).json({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini' })
  }
 
  const newHash = await bcrypt.hash(newPassword, 10)
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: newHash })
    .eq('id', req.user.id)
 
  if (updateError) return res.status(500).json({ error: 'Gagal update password' })
 
  res.json({ message: 'Kata sandi berhasil diperbarui' })
})



export default router