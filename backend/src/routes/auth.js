import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) return res.status(400).json({ error: error.message })

  res.status(201).json({ user: data.user, session: data.session })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(401).json({ error: error.message })

  res.json({ user: data.user, session: data.session })
})

// Logout membutuhkan token dari header Authorization
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  // Set session aktif dulu agar signOut berlaku untuk user yang tepat
  const { error: sessionError } = await supabase.auth.setSession({
    access_token:  token,
    refresh_token: req.body.refresh_token ?? '',
  })

  if (sessionError) return res.status(401).json({ error: sessionError.message })

  const { error } = await supabase.auth.signOut()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Logout berhasil' })
})

export default router