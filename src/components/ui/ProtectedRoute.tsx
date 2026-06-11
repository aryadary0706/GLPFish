import { Navigate } from 'react-router-dom' // Outlet bisa dihapus
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'

interface ProtectedRouteProps {
  allowedRoles?: string[]; 
  children: React.ReactNode;
}

// 1. Tambahkan 'children' di parameter ini
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { hasRole } = useRole()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Memeriksa akses...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/batches/create" replace />
  }

  // 2. Tampilkan children (komponen yang dibungkus), bukan <Outlet />
  return <>{children}</>
}