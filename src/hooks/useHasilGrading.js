import { useState, useCallback } from 'react'
import api from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API
// ═══════════════════════════════════════════════════════════════
// GET  /api/batches/:batchId/hasil
// PATCH /api/batches/:batchId/status
// GET  /api/batches/:batchId/fishes  <-- Endpoint Baru
// ═══════════════════════════════════════════════════════════════

export function useHasilGrading() {
  // State untuk data Grading
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState(null)
  const [error, setError] = useState(null)

  // State khusus untuk data Ikan (Fishes)
  const [fishes, setFishes] = useState([])
  const [loadingFishes, setLoadingFishes] = useState(false)

  // GET /api/batches/:batchId/hasil
  const fetchGrading = useCallback(async (batchId) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/batches/${batchId}/hasil`)
      setGrading(data.grading || data)
    } catch (err) {
      // ── PENANGANAN ERROR 404 (BATCH BARU / BELUM ADA HASIL) ──
      if (err.response && err.response.status === 404) {
        console.warn(`Hasil grading untuk batch ${batchId} belum ada. Menggunakan nilai default 0.`);
        setGrading({
          totalIkan: 0,
          avgConfidence: 0,
          duration: "00:00",
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          totalBerat: 0
        });
      } else {
        console.error("Fetch Grading Error:", err)
        setError(err.response?.data?.message || err.response?.data?.error || 'Gagal memuat hasil grading')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // GET /api/batches/:batchId/fishes
  const fetchFishes = useCallback(async (batchId) => {
    setLoadingFishes(true)
    try {
      const { data } = await api.get(`/batches/${batchId}/fishes`)
      setFishes(data.fishes || [])
    } catch (err) {
      console.error("Fetch Fishes Error:", err)
      setError(err.response?.data?.message || err.response?.data?.error || 'Gagal memuat foto ikan')
    } finally {
      setLoadingFishes(false)
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

  // Pastikan untuk meng-export fungsi dan state baru
  return {
    fetchGrading,
    saveGrading,
    rejectGrading,
    fetchFishes,     // <-- Baru
    grading,
    fishes,          // <-- Baru
    loading,
    loadingFishes,   // <-- Baru
    error
  }
}