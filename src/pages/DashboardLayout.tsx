import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';

export default function DashboardLayout() {
  const location = useLocation();
  
  let activeMenu: 'gallery' | 'camera' | 'stats' | 'settings' | 'admin' = 'gallery';

  if (location.pathname.includes('/upload')) {
    activeMenu = 'camera';
  } else if (location.pathname.includes('/statistic')) {
    activeMenu = 'stats';
  } else if (location.pathname.includes('/settings')) {
    activeMenu = 'settings';
  } else if (location.pathname.startsWith('/admin')) {
    activeMenu = 'admin';
  } else if (location.pathname.includes('/hasil')) {
    activeMenu = 'gallery';
  }

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans">
      {/* Memanggil Sidebar Baru yang kita desain */}
      <Sidebar activeMenu={activeMenu} />
      
      {/* Area Konten Utama */}
      {/* Karena DashboardPage dihapus, <Outlet /> akan langsung merender CreateBatchPage saat pertama login */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}