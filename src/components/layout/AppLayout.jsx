import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Bell,
  User,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import NotificationList from './NotificationList';

export default function AppLayout() {
  const { logout, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const { user } = useAuth();

  //metadata user name
  const displayName = user.name || 'Tidak termuat'
  const displayRole = user.role || '-'

  const handleLogout = async () => {
    await logout()
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@glpfish.com';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR FIXED - Sisi Kiri */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-20">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FB7D00] text-white shadow-lg shadow-orange-200">
              <span className="font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">GLPFish</span>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 px-4 space-y-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all group ${isActive
                ? 'bg-[#FB7D00] text-white shadow-md shadow-orange-100'
                : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </div>
            <ChevronRight size={14} className="opacity-50 group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FB7D00] font-bold shadow-inner">
              {loading ? '...' : displayName[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">
                {loading ? 'Memuat...' : displayName}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Petugas Inspeksi</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* AREA KONTEN - Sisi Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-slate-800">Sistem Kontrol Kualitas Ikan</h2>
            <p className="text-[11px] text-slate-400 font-medium italic">Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Notifikasi */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className={`p-2.5 rounded-full transition-all relative ${showNotif
                    ? 'text-[#FB7D00] bg-orange-50'
                    : 'text-slate-400 hover:text-[#FB7D00] hover:bg-orange-50'
                  }`}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* Dropdown Notifikasi */}
              {showNotif && (
                <>
                  {/* Overlay untuk menutup notif saat klik di luar */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)}></div>
                  <div className="relative z-50">
                    <NotificationList />
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            {/* Tombol Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>

  );
}