import axios from 'axios'
import { supabase } from '@/lib/supabase'

/**
 * api — Axios instance yang otomatis menyisipkan Bearer token
 * dari sesi Supabase aktif ke setiap request ke backend Express.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: sisipkan access_token Supabase ke header Authorization
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api