import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

// Pages
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SettingsPage from './pages/SettingsPage'

/**
 * App — root component.
 *
 * Route structure:
 *   /                    → redirect to /dashboard
 *   /login               → LoginPage     (AuthLayout)
 *   /register            → RegisterPage  (AuthLayout)
 *   /dashboard           → DashboardPage (AppLayout, protected)
 *   *                    → NotFoundPage
 *
 * To add a new protected page:
 *   1. Create src/pages/YourPage.jsx
 *   2. Add <Route path="/your-path" element={<YourPage />} /> inside the AppLayout route
 *   3. Add a NavLink in AppLayout.jsx
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── Auth routes (no auth required) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Protected app routes ── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
