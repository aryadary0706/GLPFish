import React from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';

export default function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  type Menu = 'gallery' | 'camera' | 'stats' | 'settings' | 'admin';

  // Override eksplisit lewat query (?via=upload) — dipasang Sidebar saat klik
  // Upload yang berakhir di /hasil supaya highlight tetap di Upload.
  const viaParam = searchParams.get('via');
  const overrideMenu: Menu | null = viaParam === 'upload' ? 'camera' : null;

  let activeMenu: Menu = 'gallery';

  if (overrideMenu) {
    activeMenu = overrideMenu;
  } else if (location.pathname.includes('/upload')) {
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