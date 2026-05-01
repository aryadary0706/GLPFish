import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null  // jangan render apa-apa saat checking

  return user ? children : <Navigate to="/login" replace />
}
