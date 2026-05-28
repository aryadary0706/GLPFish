import React from 'react';
import { BarChart2, User, Camera, Images } from 'lucide-react';
// Import logo secara langsung dari folder assets agar dikenali oleh bundler (Vite/Webpack)
import logoGanusa from '@/assets/Logo_ganusa.png';

interface SidebarProps {
  activeMenu?: 'camera' | 'gallery' | 'stats';
}

export const Sidebar = ({ activeMenu = 'gallery' }: SidebarProps) => {
  return (
    <aside className="w-[80px] min-w-[80px] h-screen bg-white border-r border-gray-200 flex flex-col items-center py-6 sticky top-0">
      <div className="mb-8">
        <img 
          src={logoGanusa} // Gunakan variabel hasil import di sini
          alt="Ganusa Logo" 
          className="w-10 h-10 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; 
            target.src = "[https://ui-avatars.com/api/?name=G&background=ffedd5&color=f97316&rounded=true](https://ui-avatars.com/api/?name=G&background=ffedd5&color=f97316&rounded=true)";
          }}
        />
      </div>

      <nav className="flex flex-col gap-4 flex-1 w-full items-center">
        <button 
          className={`p-3 rounded-xl transition-colors ${activeMenu === 'camera' ? 'bg-orange-100 text-orange-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          title="Upload"
        >
          <Camera size={24} />
        </button>

        <button 
          className={`p-3 rounded-xl transition-colors ${activeMenu === 'gallery' ? 'bg-orange-100 text-orange-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          title="Batches"
        >
          <Images size={24} />
        </button>

        <button 
          className={`p-3 rounded-xl transition-colors ${activeMenu === 'stats' ? 'bg-orange-100 text-orange-500' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          title="Statistics"
        >
          <BarChart2 size={24} />
        </button>
      </nav>

      <div className="mt-auto">
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <User size={20} />
        </button>
      </div>
    </aside>
  );
};