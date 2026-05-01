import { supabase } from '../lib/supabase.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  const token = header.split(' ')[1]

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah expired' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('[requireAuth]', err.message)
    return res.status(500).json({ error: 'Gagal memverifikasi token' })
  }
}