// src/hooks/useProfiles.js
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me')
        setProfile(res.data.user)
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal memuat profil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return { profile, loading, error }
}
