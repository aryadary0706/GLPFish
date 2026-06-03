import { useState, useCallback } from 'react'
import api from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — backend hanya perlu mengimplementasi endpoint ini
// ═══════════════════════════════════════════════════════════════
//
// GET  /api/batches/:batchId/hasil
//   Response: {
//     grading: {
//       batchId:        string,
//       jenis:          string,
//       totalIkan:      number,
//       avgConfidence:  number,          // rata-rata confidence 0-100
//       duration:       string,          // "MM:SS"
//       gradeA:         number,
//       gradeB:         number,
//       gradeC:         number,
//       totalBerat:     number,          // kg
//       fish: [{
//         id:           number,
//         name:         string,          // "fish #1"
//         grade:        "A" | "B" | "C",
//         confidence:   number,          // 0-100
//         imageUrl?:    string           // opsional, untuk preview foto
//       }]
//     }
//   }
//
// PATCH /api/batches/:batchId/status
//   Body:     { status: "saved" | "rejected" }
//   Response: { success: true, message: string }
//
// ═══════════════════════════════════════════════════════════════

// ─── Helper: bangun daftar ikan secara deterministik (mock) ───
const CONF = {
  A: [96.8, 94.2, 97.1, 95.7, 93.4, 96.1, 98.2, 95.3, 94.8, 97.6, 96.3, 95.1],
  B: [91.5, 92.3, 89.7, 91.8, 90.2, 92.8, 91.1, 93.2, 90.8, 92.1, 91.6, 90.5],
  C: [88.9, 87.4, 86.8, 89.1, 88.2, 87.9, 88.6, 86.5, 89.3, 87.6, 88.0, 86.9],
}
const GRADE_PATTERN = ['A','A','B','A','A','A','C','A','A','B','A','A','A','B','A','C','A','A','B','A']

function buildFishList(totalA, totalB, totalC) {
  const remaining = { A: totalA, B: totalB, C: totalC }
  const counters  = { A: 0, B: 0, C: 0 }
  const fish = []

  for (let i = 0; i < totalA + totalB + totalC; i++) {
    const preferred = GRADE_PATTERN[i % GRADE_PATTERN.length]
    let grade = remaining[preferred] > 0 ? preferred
              : remaining.A > 0 ? 'A'
              : remaining.B > 0 ? 'B'
              : 'C'

    remaining[grade]--
    fish.push({
      id:         i + 1,
      name:       `fish #${i + 1}`,
      grade,
      confidence: CONF[grade][counters[grade]++ % CONF[grade].length],
    })
  }
  return fish
}

// ─── Mock per batch (hapus saat backend siap) ─────────────────
const MOCK_BY_BATCH = {
  'B-2406-015': { jenis: 'Kakap merah',       totalIkan: 120, avgConfidence: 94.6, duration: '02:14', gradeA: 78, gradeB: 29, gradeC: 13, totalBerat: 48.5 },
  'B-2406-014': { jenis: 'Kakap merah',       totalIkan: 88,  avgConfidence: 91.2, duration: '01:50', gradeA: 54, gradeB: 22, gradeC: 12, totalBerat: 34.1 },
  'B-2406-013': { jenis: 'Tuna sirip kuning', totalIkan: 142, avgConfidence: 93.1, duration: '02:58', gradeA: 91, gradeB: 38, gradeC: 13, totalBerat: 71.8 },
  'B-2406-012': { jenis: 'Kerapu',            totalIkan: 64,  avgConfidence: 91.8, duration: '01:22', gradeA: 40, gradeB: 18, gradeC:  6, totalBerat: 22.4 },
  'B-2406-011': { jenis: 'Kakap merah',       totalIkan: 96,  avgConfidence: 92.4, duration: '02:01', gradeA: 62, gradeB: 24, gradeC: 10, totalBerat: 38.6 },
}
const FALLBACK_MOCK = MOCK_BY_BATCH['B-2406-014']

// ─── Hook ─────────────────────────────────────────────────────
export function useHasilGrading() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [grading, setGrading] = useState(null)

  const fetchGrading = useCallback(async (batchId) => {
    setLoading(true)
    setError(null)
    try {
      // ── Aktifkan saat backend siap: ──────────────────────────
      const { data } = await api.get(`/batches/${batchId}/hasil`)
      setGrading(data.grading)
      // ─────────────────────────────────────────────────────────

      const base = MOCK_BY_BATCH[batchId] ?? { ...FALLBACK_MOCK }
      setGrading({ batchId, ...base, fish: buildFishList(base.gradeA, base.gradeB, base.gradeC) })
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat hasil grading')
    } finally {
      setLoading(false)
    }
  }, [])

  // PATCH /api/batches/:batchId/status  { status: "saved" }
  const saveGrading = useCallback(async (batchId) => {
    try {
      await api.patch(`/batches/${batchId}/status`, { status: 'saved' })
    } catch (err) {
      // Jika endpoint belum ada di backend, log warning saja dan lanjut
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        console.warn('[useHasilGrading] endpoint belum ada, skip save:', err.message)
        return
      }
      throw new Error(err.response?.data?.error || 'Gagal menyimpan grading')
    }
  }, [])

  // PATCH /api/batches/:batchId/status  { status: "rejected" }
  const rejectGrading = useCallback(async (batchId) => {
    try {
      await api.patch(`/batches/${batchId}/status`, { status: 'rejected' })
    } catch (err) {
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
        console.warn('[useHasilGrading] endpoint belum ada, skip reject:', err.message)
        return
      }
      throw new Error(err.response?.data?.error || 'Gagal menolak grading')
    }
  }, [])

  return { fetchGrading, saveGrading, rejectGrading, grading, loading, error }
}
