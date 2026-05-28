// src/hooks/useInspection.js
import { useState, useCallback, useEffect } from 'react'
import api from '@/lib/api'

// ─────────────────────────────────────────────────────────────
// Hook: useUploadPredict
// Kirim foto mata + insang → dapat hasil prediksi langsung
// ─────────────────────────────────────────────────────────────
export function useUploadPredict() {
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [prediction, setPrediction] = useState(null)

  /**
   * @param {File} eyeFile   - File foto mata dari <input type="file">
   * @param {File} gillFile  - File foto insang dari <input type="file">
   */
  const uploadAndPredict = useCallback(async (eyeFile, gillFile) => {
    setLoading(true)
    setError(null)
    setPrediction(null)

    const formData = new FormData()
    formData.append('eye',  eyeFile)
    formData.append('gill', gillFile)

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

// ─────────────────────────────────────────────────────────────
// Hook: useInspections
// Ambil semua riwayat inspeksi milik user dari DB
// ─────────────────────────────────────────────────────────────
export function useInspections() {
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [inspections, setInspections] = useState([])

  const fetchInspections = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get('/inspections')
      // data.inspections: array of { id, file_name, storage_path, uploaded_at, prediction_results }
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

  // Auto-fetch saat pertama mount
  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  // refresh = alias fetchInspections, kompatibel dengan DashboardPage
  return { fetchInspections, refresh: fetchInspections, inspections, loading, error }
}

// ─────────────────────────────────────────────────────────────
// Hook: useInspectionDetail
// Ambil detail satu inspeksi berdasarkan image_id
// ─────────────────────────────────────────────────────────────
export function useInspectionDetail() {
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [inspection, setInspection] = useState(null)

  /**
   * @param {string} imageId - UUID dari tabel images
   */
  const fetchDetail = useCallback(async (imageId) => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/inspections/${imageId}`)
      // data.inspection: { id, file_name, storage_path, prediction_results: { grade, ... } }
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