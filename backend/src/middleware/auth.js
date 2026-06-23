import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah expired' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' })
  }
  next()
}

/**
 * Verifikasi batch milik user (atau user adalah admin).
 * Ambil batchId dari req.params.batchId (route :batchId), req.params.id, atau req.body.batch_id / fish_id.
 * Untuk fish_id, kita resolve batch-nya dulu. Attach req.batch ke request agar handler bisa pakai.
 */
export async function requireBatchOwner(req, res, next) {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'User tidak terautentikasi' })

    let batchId = req.params.batchId || req.params.id || req.body?.batch_id
    const fishId = req.body?.fish_id

    if (!batchId && fishId) {
      const { data: fish, error: fishErr } = await supabase
        .from('fishes')
        .select('batch_id')
        .eq('id', fishId)
        .single()
      if (fishErr || !fish) {
        return res.status(404).json({ error: 'Ikan tidak ditemukan' })
      }
      batchId = fish.batch_id
    }

    if (!batchId) {
      return res.status(400).json({ error: 'batch_id wajib disertakan' })
    }

    const { data: batch, error } = await supabase
      .from('batches')
      .select('id, user_id, preprocessed_status, status, fish_count')
      .eq('id', batchId)
      .single()

    if (error || !batch) {
      return res.status(404).json({ error: 'Batch tidak ditemukan' })
    }

    if (batch.user_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Batch ini bukan milik Anda.' })
    }

    req.batch = batch
    next()
  } catch (err) {
    console.error('[requireBatchOwner]', err.message)
    res.status(500).json({ error: 'Gagal memverifikasi kepemilikan batch' })
  }
}