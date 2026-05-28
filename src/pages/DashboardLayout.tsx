import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';

export default function DashboardLayout() {
  const location = useLocation();
  
  // Logika sederhana untuk menentukan ikon menu mana yang sedang aktif
  // Default ke 'gallery' karena halaman pertama yang muncul adalah Create Batch
  let activeMenu: 'gallery' | 'camera' | 'stats' = 'gallery';
  
  if (location.pathname.includes('/upload')) {
    activeMenu = 'camera';
  } else if (location.pathname.includes('/statistic')) {
    activeMenu = 'stats';
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