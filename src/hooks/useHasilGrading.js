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
export function useHasilGrading() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [grading, setGrading] = useState(null)

  // GET /api/batches/:batchId/hasil
  const fetchGrading = useCallback(async (batchId) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/batches/${batchId}/hasil`)
      // Mengambil objek grading dari respons API
      setGrading(data.grading || data) 
    } catch (err) {
      console.error("Fetch Grading Error:", err)
      setError(err.response?.data?.message || err.response?.data?.error || 'Gagal memuat hasil grading')
    } finally {
      setLoading(false)
    }
  }, [])

  // PATCH /api/batches/:batchId/status  { status: "saved" }
  const saveGrading = useCallback(async (batchId) => {
    try {
      await api.patch(`/batches/${batchId}/status`, { status: 'saved' })
    } catch (err) {
      throw new Error(err.response?.data?.message || err.response?.data?.error || 'Gagal menyimpan grading')
    }
  }, [])

  // PATCH /api/batches/:batchId/status  { status: "rejected" }
  const rejectGrading = useCallback(async (batchId) => {
    try {
      await api.patch(`/batches/${batchId}/status`, { status: 'rejected' })
    } catch (err) {
      throw new Error(err.response?.data?.message || err.response?.data?.error || 'Gagal menolak grading')
    }
  }, [])

  return { fetchGrading, saveGrading, rejectGrading, grading, loading, error }
}