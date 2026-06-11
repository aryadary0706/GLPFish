import { createContext, useState, useEffect, useCallback } from 'react'
import { AuthService  } from '@/services/AuthServices'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session dari token yang tersimpan
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    AuthService.getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // Handle token expired dari interceptor axios
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('unauthorized', handler)
    return () => window.removeEventListener('unauthorized', handler)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      // 1. Tangkap seluruh balasannya dulu (jangan langsung dibongkar)
      const response = await AuthService.login({ email, password })
      console.log('[HASIL ASLI DARI BACKEND]:', response)

      // 2. Antisipasi apakah datanya dibungkus dalam 'response.data' (khas Axios)
      const payload = response.data ? response.data : response;

      // 3. Ambil token dan user dari payload
      // (Antisipasi juga kalau backend-mu menamakan tokennya 'accessToken')
      const token = payload.token || payload.accessToken;
      const userData = payload.user || payload;

      if (!token) {
        console.error("Gawat, token benar-benar tidak dikirim oleh backend!");
        return { success: false, message: 'Format respons backend tidak sesuai' };
      }

      console.log('Token berhasil ditangkap:', token)
      
      // 4. Simpan dan update state
      localStorage.setItem('token', token)
      setUser(userData)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.error ?? 'Login gagal' }
    }
  }, [])

  const register = useCallback(async ({ email, password, name, role  }) => {
    try {
      const { user, token } = await AuthService.register({ email, password, name, role })
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.error ?? 'Registrasi gagal' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await AuthService.logout()
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await AuthService.getMe()
      setUser(user)
    } catch {
      // token invalid, paksa logout
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}