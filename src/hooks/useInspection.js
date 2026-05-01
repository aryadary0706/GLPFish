import { useState, useEffect } from 'react'
import api from '@/services/api'

/**
 * useInspections — mengambil riwayat inspeksi milik user yang login.
 * Memanggil GET /api/inspections (backend Express → Supabase).
 */
export function useInspections() {
  const [inspections, setInspections] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [tick,        setTick]        = useState(0)

  // Panggil refresh() untuk memuat ulang data dari backend
  const refresh = () => setTick(t => t + 1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api
      .get('/inspections')
      .then(({ data }) => {
        if (!cancelled) setInspections((data.inspections ?? []).slice(0, 3))
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error ?? err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  return { inspections, loading, error, refresh }
}
