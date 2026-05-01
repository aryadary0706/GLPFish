import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')        // sesuaikan jika nama tabel Anda 'profiles'
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

export default router