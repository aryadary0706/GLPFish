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
      const { user, token } = await AuthService.login({ email, password })
      console.log('token:', token)
      console.log('user:', user)
      localStorage.setItem('token', token)
      setUser(user)
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