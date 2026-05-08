import React from 'react';

const MOCK_NOTIFS = [
  { id: 1, title: 'Kualitas Rendah Terdeteksi', time: '2 menit yang lalu', type: 'warning' },
  { id: 2, title: 'Laporan Mingguan Siap', time: '1 jam yang lalu', type: 'info' }
];

export default function NotificationList() {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h4 className="font-bold text-slate-800">Notifikasi</h4>
        <span className="text-[10px] bg-orange-100 text-[#FB7D00] px-2 py-0.5 rounded-full font-bold">Baru</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {MOCK_NOTIFS.map((n) => (
          <div key={n.id} className="p-4 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors">
            <p className="text-sm font-semibold text-slate-700">{n.title}</p>
            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
          </div>
        ))}
      </div>
      <button className="w-full py-3 text-xs font-bold text-[#FB7D00] hover:bg-orange-50 transition-colors">
        Lihat Semua Notifikasi
      </button>
    </div>
  );
}