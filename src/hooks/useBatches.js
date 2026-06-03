import { useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — batch management
// ═══════════════════════════════════════════════════════════════
//
// POST /api/batches
//   Body: {
//     jenis:             string,   // "Kakap merah"
//     tanggal:           string,   // "2026-05-24"
//     lokasi:            string,
//     estimasi_jumlah:   number,
//     berat_total:       number,
//     catatan?:          string
//   }
//   Response: {
//     batch: { id: "B-2406-015", status: "incomplete", ... }
//   }
//
// GET /api/batches
//   Query params (opsional): ?status=completed|incomplete
//   Response: {
//     batches: [{
//       id:       string,
//       jenis:    string,
//       tanggal:  string,    // ISO date
//       status:   "completed" | "incomplete",
//       gradeA:   number,    // agregasi dari prediction_results
//       gradeB:   number,
//       gradeC:   number,
//       total:    number,    // total ikan sudah diproses
//       berat:    number,    // kg
//       estimasi_jumlah: number
//     }]
//   }
//
// PATCH /api/batches/:batchId/status
//   Body:     { status: "saved" | "rejected" }
//   Response: { success: true, message: string }
//
// ═══════════════════════════════════════════════════════════════

// ─── Mock recent batches (hapus saat backend siap) ────────────
const MOCK_RECENT = [
  { id: 'B-2406-015', date: '24 Mei', count: '120',    status: 'Completed' },
  { id: 'B-2406-014', date: '23 Mei', count: '88/120', status: 'Incomplete' },
  { id: 'B-2406-013', date: '22 Mei', count: '142',    status: 'Completed' },
  { id: 'B-2406-012', date: '22 Mei', count: '64',     status: 'Completed' },
  { id: 'B-2406-011', date: '21 Mei', count: '96',     status: 'Completed' },
]

export function useBatches() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [batches, setBatches] = useState(MOCK_RECENT)

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // ── Aktifkan saat backend siap: ──────────────────────────
      const { data } = await api.get('/batches')
      // Map ke format yang sama dengan mock: { id, date, count, status }
      setBatches(data.batches.map(b => ({
        id:     b.id,
        date:   new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        count:  b.status === 'incomplete'
                  ? `${b.total}/${b.estimasi_jumlah}`
                  : String(b.total),
        status: b.status === 'completed' ? 'Completed' : 'Incomplete',
      })))
      // ─────────────────────────────────────────────────────────
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat daftar batch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBatches() }, [fetchBatches])

  const createBatch = useCallback(async (formData) => {
    // ── Aktifkan saat backend siap: ──────────────────────────
    const { data } = await api.post('/batches', formData)
    return data.batch 
    // ─────────────────────────────────────────────────────────

    // // Mock: return fake batch ID
    // console.warn('[useBatches] createBatch mock — backend belum siap')
    // return { id: 'B-2406-016', status: 'incomplete' }
  }, [])

  return { fetchBatches, createBatch, batches, loading, error }
}
