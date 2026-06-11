import { AuthProvider } from './context/AuthContext'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
// Layouts
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/ui/ProtectedRoute';
import DashboardLayout from './pages/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StatisticPage from './pages/StatisticPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import HasilGradingPage from './pages/HasilGradingPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';

// Import Halaman Baru
import { CreateBatchPage } from './pages/CreateBatchPage';
import { UploadPhotoPage } from './pages/UploadPhotoPage';

import { useBatches } from './hooks/useBatches';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Auth routes (no auth required) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Main App Layout ── */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Default redirect: saat user mengakses '/', langsung lempar ke /batches/create */}
          <Route index element={<Navigate to="/batches/create" replace />} />
          
          {/* RUTE PENANGKAP: Jika ada sistem lama yang mengarah ke '/dashboard' */}
          <Route path="dashboard" element={<Navigate to="/batches/create" replace />} />
          
          {/* Rute Baru: Create Batch */}
          <Route path="batches/create" element={<CreateBatchWrapper />} />
          
          {/* Rute Baru: Upload Photo (Dinamis menggunakan :batchId) */}
          <Route path="batches/:batchId/upload" element={<UploadWrapper />} />

          {/* Hasil Grading */}
          <Route path="batches/:batchId/hasil" element={<HasilGradingPage />} />

          {/* Statistic / Distribusi */}
          <Route path="statistic" element={<StatisticPage />} />

          {/* Admin dashboard */}
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/users/:userId" element={<AdminUserDetailPage />} />
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
  );
}

// ── WRAPPERS UNTUK MENYAMBUNGKAN NAVIGASI ──
function CreateBatchWrapper() {
  const navigate = useNavigate();
  return (
    <CreateBatchPage 
      // ✅ Menangkap ID dari API dan mengarahkannya ke URL yang benar
      onNavigateToUpload={(data) => navigate(`/batches/${data.batchId}/upload`)} 
    />
  );
}

function UploadWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  // Tangkap data form dari halaman Create Batch
  const batchData = location.state?.batchData;

  return (
    <UploadPhotoPage 
      onBack={() => navigate('/batches/create')} 
    />
  );
}