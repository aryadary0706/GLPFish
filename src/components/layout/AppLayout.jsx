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
  // const { user } = useAuth();

  //metadata user name
  const displayName = user.name || 'Tidak termuat'
  const displayRole = user.role || '-'

  const handleLogout = async () => {
    await logout()
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@glpfish.com' || user?.email === 'admin123@gmail.com';

  return (

    <div className="relative flex min-h-screen overflow-hidden bg-transparent">
      {/* BACKGROUND */}

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <img
          src="/images/Vector.png"
          alt="background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="fixed inset-0 bg-transparent -z-10"></div>
      {/* SIDEBAR FIXED - Sisi Kiri */}
      {/* SIDEBAR GLASSMORPHISM */}
      <aside
        className="
          w-72
          h-[92vh]
          my-4 ml-4
          rounded-[30px]
          bg-transparent
          backdrop-blur-xl
          border border-white/20
          shadow-2xl shadow-black/10
          flex flex-col
          sticky top-4
          z-20
          overflow-hidden
        "
      >
        {/* Glass Overlay
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 pointer-events-none"></div> */}

        {/* SIDEBAR CONTENT */}
        <div className="relative z-10 flex flex-col h-full">

          {/* LOGO */}
          <div className="p-8">
            <div className="flex items-center gap-3">

              <div
                className="
            flex h-11 w-11
            items-center justify-center
            rounded-2xl
            bg-[#FB7D00]/90
            text-white
            shadow-lg
          "
              >
                <span className="font-bold text-xl">G</span>
              </div>

              <div>
                <p className="text-xl font-black text-white tracking-tight">
                  GLPFish
                </p>

                <p className="text-xs text-white/60">
                  Quality Control
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 space-y-2">
            <p
              className="
          px-4 mb-2
          text-[10px]
          font-bold
          text-white/40
          uppercase
          tracking-widest
        "
            >
              Main Menu
            </p>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `
          flex items-center justify-between
          px-4 py-3.5
          rounded-2xl
          text-sm font-semibold
          transition-all
          group
          backdrop-blur-md

          ${isActive
                  ? 'bg-[#FB7D00]/80 text-white shadow-lg'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
        `
              }
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </div>

              <ChevronRight
                size={14}
                className="
            opacity-50
            group-hover:translate-x-1
            transition-transform
          "
              />
            </NavLink>
          </nav>

          {/* PROFILE */}
          <div className="p-4 mt-auto">
            <div
              className="
          flex items-center gap-3
          p-3 mb-3
          rounded-2xl
          bg-transparent
          backdrop-blur-md
          border border-white/10
        "
            >
              <div
                className="
            w-10 h-10
            rounded-full
            bg-[#FB7D00]/80
            flex items-center justify-center
            text-white font-bold
          "
              >
                {user?.name?.[0] || 'U'}
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {user?.name || 'User'}
                </p>

                <p
                  className="
              text-[10px]
              font-medium
              text-white/50
              uppercase
              tracking-tighter
            "
                >
                  Petugas Inspeksi
                </p>
              </div>
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="
          flex w-full items-center gap-3
          px-4 py-3
          rounded-2xl
          text-sm font-bold
          text-red-200
          hover:bg-red-500/20
          transition-all
        "
            >
              <LogOut size={20} />
              Keluar Sistem
            </button>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN - Sisi Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
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
        {/* Main Content Scrollable Area */}
        <main className="p-10 relative z-10">
          <div
            className="
            max-w-6xl mx-auto
            bg-white/10
            backdrop-blur-lg
            rounded-[30px]
            border border-white/20
            p-8
          "
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>

  );
}