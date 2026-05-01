// src/hooks/useProfiles.js
import { useState, useEffect } from 'react'
import api from '@/services/api'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // baseURL = http://localhost:4000/api  →  full URL: /api/user/me
        const res = await api.get('/user/me')
        setProfile(res.data.user.profile)
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