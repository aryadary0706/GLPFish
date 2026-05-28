import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Layouts
import AuthLayout from './components/layout/AuthLayout'
import ProtectedRoute from './components/ui/ProtectedRoute'
import DashboardLayout from './pages/DashboardLayout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StatisticPage from './pages/StatisticPage'
import NotFoundPage from './pages/NotFoundPage'
import SettingsPage from './pages/SettingsPage'

// Import Halaman Baru (Sesuaikan path-nya jika berbeda)
import { CreateBatchPage } from './pages/CreateBatchPage'
import { UploadPhotoPage } from './pages/UploadPhotoPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Auth routes (no auth required) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Main App Layout (MENGGUNAKAN DASHBOARD LAYOUT & SIDEBAR BARU) ── */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Default redirect: saat user mengakses '/', langsung lempar ke /batches/create */}
          <Route index element={<Navigate to="/batches/create" replace />} />
          
          {/* RUTE PENANGKAP: Jika ada sistem lama yang mengarah ke '/dashboard', 
              langsung dialihkan ke halaman create batch */}
          <Route path="dashboard" element={<Navigate to="/batches/create" replace />} />
          
          {/* Rute Baru: Create Batch */}
          <Route path="batches/create" element={<CreateBatchWrapper />} />
          
          {/* Rute Baru: Upload Photo */}
          <Route path="batches/:batchId/upload" element={<UploadWrapper />} />
          
          {/* Statistic route (Opsional jika masih dipakai) */}
          <Route path="statistic" element={<StatisticPage />} />
        </Route>

        {/* Settings Route */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

// ── WRAPPERS UNTUK MENYAMBUNGKAN NAVIGASI ──
function CreateBatchWrapper() {
  const navigate = useNavigate();
  return (
    <CreateBatchPage 
      onNavigateToUpload={() => navigate('/batches/B-2406-015/upload')} 
    />
  );
}

function UploadWrapper() {
  const navigate = useNavigate();
  return (
    <UploadPhotoPage 
      onBack={() => navigate('/batches/create')} 
    />
  );
}