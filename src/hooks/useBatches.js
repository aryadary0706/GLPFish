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
export function useBatches() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [batches, setBatches] = useState([]) // 👈 Langsung mulai dengan array kosong, hapus MOCK_RECENT

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/batches')
      
      // 💥 PERUBAHAN UTAMA: 
      // Langsung masukkan data mentah dari backend apa adanya!
      // Jangan di-map atau diubah nama variabelnya.
      setBatches(data.batches || data || [])

    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat daftar batch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchBatches() 
  }, [fetchBatches])

  const createBatch = useCallback(async (formData) => {
    const { data } = await api.post('/batches', formData)
    return data.batch 
  }, [])

  return { fetchBatches, createBatch, batches, loading, error }
}