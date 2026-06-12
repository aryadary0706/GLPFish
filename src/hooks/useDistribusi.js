import { useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — distribusi grade per batch
// ═══════════════════════════════════════════════════════════════
//
// GET /api/batches/distribusi
//   Query params (opsional): ?jenis=Kakap+merah&search=B-2406
//   Response: {
//     stats: {
//       totalBatch:     number,
//       totalIkan:      number,
//       gradeAPercent:  number,   // 0-100
//       rejectPercent:  number    // persentase Grade C
//     },
//     batches: [{
//       id:      string,
//       date:    string,          // "24 Mei 2026" — format dari backend
//       jenis:   string,
//       gradeA:  number,
//       gradeB:  number,
//       gradeC:  number,
//       total:   number,
//       berat:   number,          // kg (float)
//       status:  "completed" | "incomplete"
//     }]
//   }
//
// Catatan: search & filter dilakukan di sisi frontend dari data yang direturn.
// Jika data batch sangat besar (>500), pertimbangkan untuk pindah ke server-side
// filtering dengan menambah query params ke endpoint ini.
//
// ═══════════════════════════════════════════════════════════════

const MOCK_STATS = {
  totalBatch: 24, totalIkan: 2148, gradeAPercent: 62, rejectPercent: 11,
}

const MOCK_BATCHES = [
  { id: 'B-2406-015', date: '24 Mei 2026', jenis: 'Kakap merah',       gradeA: 78, gradeB: 29, gradeC: 13, total: 120, berat: 48.5, status: 'completed' },
  { id: 'B-2406-014', date: '23 Mei 2026', jenis: 'Kakap merah',       gradeA: 54, gradeB: 22, gradeC: 12, total: 88,  berat: 34.1, status: 'incomplete' },
  { id: 'B-2406-013', date: '22 Mei 2026', jenis: 'Tuna sirip kuning', gradeA: 91, gradeB: 38, gradeC: 13, total: 142, berat: 71.8, status: 'completed' },
  { id: 'B-2406-012', date: '22 Mei 2026', jenis: 'Kerapu',            gradeA: 40, gradeB: 18, gradeC:  6, total: 64,  berat: 22.4, status: 'completed' },
  { id: 'B-2406-011', date: '21 Mei 2026', jenis: 'Kakap merah',       gradeA: 62, gradeB: 24, gradeC: 10, total: 96,  berat: 38.6, status: 'completed' },
  { id: 'B-2406-010', date: '20 Mei 2026', jenis: 'Bandeng',           gradeA: 71, gradeB: 30, gradeC: 14, total: 115, berat: 42.0, status: 'completed' },
  { id: 'B-2406-009', date: '20 Mei 2026', jenis: 'Kakap merah',       gradeA: 58, gradeB: 25, gradeC:  8, total: 91,  berat: 36.2, status: 'completed' },
  { id: 'B-2406-008', date: '19 Mei 2026', jenis: 'Tuna sirip kuning', gradeA: 85, gradeB: 32, gradeC: 10, total: 127, berat: 63.5, status: 'completed' },
  { id: 'B-2406-007', date: '18 Mei 2026', jenis: 'Kerapu',            gradeA: 45, gradeB: 20, gradeC:  8, total: 73,  berat: 25.6, status: 'completed' },
  { id: 'B-2406-006', date: '17 Mei 2026', jenis: 'Kakap merah',       gradeA: 67, gradeB: 26, gradeC: 11, total: 104, berat: 41.6, status: 'completed' },
  { id: 'B-2406-005', date: '16 Mei 2026', jenis: 'Bandeng',           gradeA: 79, gradeB: 33, gradeC: 16, total: 128, berat: 47.2, status: 'completed' },
  { id: 'B-2406-004', date: '15 Mei 2026', jenis: 'Kakap merah',       gradeA: 52, gradeB: 21, gradeC:  9, total: 82,  berat: 32.8, status: 'completed' },
  { id: 'B-2406-003', date: '14 Mei 2026', jenis: 'Tuna sirip kuning', gradeA: 88, gradeB: 35, gradeC: 12, total: 135, berat: 67.5, status: 'completed' },
  { id: 'B-2406-002', date: '13 Mei 2026', jenis: 'Kerapu',            gradeA: 38, gradeB: 16, gradeC:  7, total: 61,  berat: 21.4, status: 'completed' },
  { id: 'B-2406-001', date: '12 Mei 2026', jenis: 'Kakap merah',       gradeA: 69, gradeB: 28, gradeC: 12, total: 109, berat: 43.6, status: 'completed' },
  { id: 'B-2405-024', date: '11 Mei 2026', jenis: 'Bandeng',           gradeA: 75, gradeB: 31, gradeC: 13, total: 119, berat: 44.0, status: 'completed' },
  { id: 'B-2405-023', date: '10 Mei 2026', jenis: 'Kakap merah',       gradeA: 60, gradeB: 24, gradeC: 10, total: 94,  berat: 37.6, status: 'completed' },
  { id: 'B-2405-022', date: '09 Mei 2026', jenis: 'Tuna sirip kuning', gradeA: 82, gradeB: 34, gradeC: 11, total: 127, berat: 63.5, status: 'completed' },
  { id: 'B-2405-021', date: '08 Mei 2026', jenis: 'Kerapu',            gradeA: 42, gradeB: 18, gradeC:  7, total: 67,  berat: 23.5, status: 'completed' },
  { id: 'B-2405-020', date: '07 Mei 2026', jenis: 'Kakap merah',       gradeA: 65, gradeB: 25, gradeC: 11, total: 101, berat: 40.4, status: 'completed' },
  { id: 'B-2405-019', date: '06 Mei 2026', jenis: 'Bandeng',           gradeA: 73, gradeB: 29, gradeC: 14, total: 116, berat: 43.0, status: 'completed' },
  { id: 'B-2405-018', date: '05 Mei 2026', jenis: 'Kakap merah',       gradeA: 56, gradeB: 22, gradeC:  9, total: 87,  berat: 34.8, status: 'completed' },
  { id: 'B-2405-017', date: '04 Mei 2026', jenis: 'Tuna sirip kuning', gradeA: 87, gradeB: 36, gradeC: 12, total: 135, berat: 67.5, status: 'completed' },
  { id: 'B-2405-016', date: '03 Mei 2026', jenis: 'Kerapu',            gradeA: 36, gradeB: 15, gradeC:  6, total: 57,  berat: 20.0, status: 'completed' },
]

export function useDistribusi() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [stats,   setStats]   = useState(MOCK_STATS)
  const [batches, setBatches] = useState(MOCK_BATCHES)

  const fetchDistribusi = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true)
    setError(null)
    try {
      // ── Aktifkan saat backend siap: ──────────────────────────
      const { data } = await api.get(`/batches/distribusi/user/${userId}`);
      setStats(data.stats)
      setBatches(data.batches)
      // ─────────────────────────────────────────────────────────
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data distribusi')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch saat pertama render
  useEffect(() => { fetchDistribusi() }, [fetchDistribusi])

  return { fetchDistribusi, stats, batches, loading, error }
}
