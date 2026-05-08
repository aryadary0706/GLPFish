import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Bell, Shield, Moon, Lock, Smartphone, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // State untuk navigasi
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 text-sm">Kelola preferensi akun dan aplikasi Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigasi Pengaturan Samping */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === 'profile' 
                ? 'bg-white text-[#FB7D00] shadow-sm border border-orange-100' 
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <User size={18} />
            <span>Profil Akun</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === 'notifications' 
                ? 'bg-white text-[#FB7D00] shadow-sm border border-orange-100' 
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Bell size={18} />
            <span>Notifikasi</span>
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === 'security' 
                ? 'bg-white text-[#FB7D00] shadow-sm border border-orange-100' 
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Shield size={18} />
            <span>Keamanan</span>
          </button>
        </div>

        {/* Konten Dinamis berdasarkan Tab */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TAB: PROFIL */}
          {activeTab === 'profile' && (
            <>
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Informasi Profil</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                    <input 
                      type="email" 
                      disabled
                      defaultValue={user?.email}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <button className="px-6 py-2.5 bg-[#FB7D00] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </section>
            </>
          )}

          {/* TAB: NOTIFIKASI */}
          {activeTab === 'notifications' && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Preferensi Notifikasi</h3>
              <div className="space-y-6">
                {[
                  { title: 'Notifikasi Email', desc: 'Dapatkan laporan harian melalui email', icon: <Mail size={18}/> },
                  { title: 'Push Notification', desc: 'Peringatan real-time di browser/hp', icon: <Smartphone size={18}/> },
                  { title: 'Laporan Mingguan', desc: 'Ringkasan statistik setiap hari Senin', icon: <Bell size={18}/> }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg text-[#FB7D00]">{item.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#FB7D00]" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB: KEAMANAN */}
          {activeTab === 'security' && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Keamanan Akun</h3>
              <div className="space-y-6">
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                    <Lock size={18} />
                    <span>Ganti Kata Sandi</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Kata sandi lama"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input 
                    type="password" 
                    placeholder="Kata sandi baru"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">
                    Update Password
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Shield size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Autentikasi Dua Faktor (2FA)</p>
                      <p className="text-xs text-slate-400">Tambahkan lapisan keamanan ekstra</p>
                    </div>
                  </div>
                  <button className="text-sm font-bold text-[#FB7D00]">Aktifkan</button>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}