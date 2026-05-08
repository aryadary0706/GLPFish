import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Otomatis sisipkan JWT di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Otomatis redirect ke login jika token expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('unauthorized'))
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api