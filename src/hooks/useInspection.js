// src/hooks/useInspection.js
import { useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — upload & predict per ikan
// ═══════════════════════════════════════════════════════════════
//
// POST /api/upload/predict  (multipart/form-data)
//   Fields:
//     eye      : File  — foto mata ikan
//     gill     : File  — foto insang ikan
//     batch_id?: string — ID batch (opsional, wajib saat batch ada di DB)
//
//   Response: {
//     success:    true,
//     image_id:   string,   // UUID dari tabel images
//     prediction: {
//       grade:          "A" | "B" | "C",
//       label:          string,           // "Grade A - Premium"
//       warna:          string,
//       layak_ekspor:   boolean,
//       mata:   { kelas, status, confidence: number, probabilitas: object },
//       insang: { kelas, status, confidence: number, probabilitas: object },
//       waktu_proses_ms: number,
//       timestamp:       string
//     }
//   }
//
// ═══════════════════════════════════════════════════════════════

export function useUploadPredict() {
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [prediction, setPrediction] = useState(null)

  /**
   * @param {File}    eyeFile   — foto mata
   * @param {File}    gillFile  — foto insang
   * @param {string=} batchId   — ID batch (opsional, kirim saat batch sudah dibuat di backend)
   */
  const uploadAndPredict = useCallback(async (eyeFile, gillFile, batchId) => {
    setLoading(true)
    setError(null)
    setPrediction(null)

    const formData = new FormData()
    formData.append('eye',  eyeFile)
    formData.append('gill', gillFile)
    // Kirim batch_id jika tersedia — backend simpan ke kolom batch_id di tabel images
    if (batchId) formData.append('batch_id', batchId)

    try {
      const { data } = await api.post('/upload/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // data = { success, image_id, prediction }
      setPrediction(data.prediction)
      return data

    } catch (err) {
      const message = err.response?.data?.error || 'Terjadi kesalahan saat analisis.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setPrediction(null)
    setError(null)
  }, [])

  return { uploadAndPredict, loading, error, prediction, reset }
}

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — riwayat inspeksi
// ═══════════════════════════════════════════════════════════════
//
// GET /api/inspections
//   Response: {
//     inspections: [{
//       id, file_name, storage_path, uploaded_at,
//       prediction_results: {
//         grade, label_text, warna, exportable,
//         confidence_score, eyes_status, eyes_confidence_score,
//         gill_status, gill_confidence_score, predicted_at
//       }
//     }]
//   }
//
// GET /api/inspections/:id
//   Response: { inspection: <same shape + storage_path_gill + waktu_proses_ms + raw_output> }
//
// ═══════════════════════════════════════════════════════════════

export function useInspections() {
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [inspections, setInspections] = useState([])

  const fetchInspections = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/inspections')
      setInspections(data.inspections)
      return data.inspections
    } catch (err) {
      const message = err.response?.data?.error || 'Gagal mengambil data inspeksi.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInspections() }, [fetchInspections])

  return { fetchInspections, refresh: fetchInspections, inspections, loading, error }
}

export function useInspectionDetail() {
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [inspection, setInspection] = useState(null)

  const fetchDetail = useCallback(async (imageId) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/inspections/${imageId}`)
      setInspection(data.inspection)
      return data.inspection
    } catch (err) {
      const message = err.response?.status === 404
        ? 'Inspeksi tidak ditemukan.'
        : err.response?.data?.error || 'Gagal mengambil detail inspeksi.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setInspection(null)
    setError(null)
  }, [])

  return { fetchDetail, inspection, loading, error, reset }
}
