import React, { useState, useRef, useEffect } from 'react';
import { BarChart2, User, Camera, Images, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logoGanusa from '@/assets/Logo_ganusa.png';

export type ActiveMenu = 'camera' | 'gallery' | 'stats' | 'settings' | 'admin';

interface SidebarProps {
  activeMenu?: ActiveMenu;
}

export const Sidebar = ({ activeMenu = 'gallery' }: SidebarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  }

  const navBtn = (
    isActive: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string,
  ) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-3 rounded-xl transition-colors ${
        isActive
          ? 'bg-[#ffe6cc] text-[#f58220]'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <aside className="w-[80px] min-w-[80px] h-screen bg-white border-r border-gray-200 flex flex-col items-center py-6 sticky top-0 z-30">
      {/* Logo */}
      <div className="mb-8">
        <img
          src={logoGanusa}
          alt="Ganusa Logo"
          className="w-10 h-10 object-contain"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.onerror = null;
            t.src = '';
          }}
        />
      </div>

      {/* Main navigation */}
      <nav className="flex flex-col gap-4 flex-1 w-full items-center">
        {navBtn(activeMenu === 'camera',  () => navigate('/batches/B-2406-015/upload'), <Camera size={24} />,     'Upload')}
        {navBtn(activeMenu === 'gallery', () => navigate('/batches/create'),            <Images size={24} />,     'Batch')}
        {navBtn(activeMenu === 'stats',   () => navigate('/statistic'),                 <BarChart2 size={24} />,  'Statistik')}
        {navBtn(activeMenu === 'admin',   () => navigate('/admin'),                     <ShieldCheck size={24} />, 'Admin')}
      </nav>

      {/* Bottom: Settings + Profile */}
      <div className="mt-auto flex flex-col items-center gap-3">
        {/* Settings icon */}
        {navBtn(activeMenu === 'settings', () => navigate('/settings'), <Settings size={22} />, 'Pengaturan')}

        {/* Profile button with popup */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            title="Profil"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              profileOpen
                ? 'bg-[#ffe6cc] text-[#f58220]'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <User size={20} />
          </button>

          {/* Popup menu */}
          {profileOpen && (
            <div className="absolute bottom-0 left-[52px] bg-white border border-gray-200 rounded-xl shadow-xl w-56 overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ffe6cc] flex items-center justify-center shrink-0">
                    <User size={15} className="text-[#f58220]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate leading-tight">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={15} />
                  Keluar aplikasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
