import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()
const SALT_ROUNDS = 12
const TOKEN_TTL   = '3d'


// REGISTER
router.post('/register', async (req, res) => {
  let { email, password, name, role } = req.body
  if (!email || !password || !name )
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' })
  role = role || 'staff'

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' })

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  // Default saat ini: Staff
  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password: hashed, name, role })
    .select('id, email, name, role, created_at')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  )

  res.status(201).json({ user, token })
})

//login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email dan password wajib diisi' })

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, created_at')
    .eq('email', email)
    .maybeSingle()

  // Gunakan pesan generik agar tidak bocor info akun
  if (error || !user)
    return res.status(401).json({ error: 'Email atau password salah' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Email atau password salah' })

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  )

  const { password: _, ...safeUser } = user  // jangan kirim hash ke client
  res.json({ user: safeUser, token })
})

// Logout membutuhkan token dari header Authorization
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout berhasil' })
})

export default router