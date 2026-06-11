// src/hooks/useRole.js
import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  // Ambil role langsung dari data user bawaan backend.
  // Jika user atau role belum ada (misal saat baru load), default ke 'staff'
  const role = user?.role || 'staff'

  const isAdmin = role === 'admin'
  const isStaff = role === 'staff'

  const hasRole = (allowedRoles) => {
    if (typeof allowedRoles === 'string') return role === allowedRoles
    if (Array.isArray(allowedRoles)) return allowedRoles.includes(role)
    return false
  }

  return { role, isAdmin, isStaff, hasRole }
}