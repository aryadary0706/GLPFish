import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { User, Bell, Shield, Lock, Smartphone, Mail } from "lucide-react";
import FeedbackMessage from "../components/ui/FeedbackMessage";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileFeedback, setProfileFeedback] = useState({ type: "", message: "" });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: "", message: "" });

  // ─── useForm: profil ──────────────────────────────────
  const {
    values: profileValues,
    errors: profileErrors,
    handleChange: handleProfileChange,
    setError: setProfileError,
  } = useForm({ name: user?.name || "" });

  // ─── useForm: password ────────────────────────────────
  const {
    values: passwordValues,
    errors: passwordErrors,
    handleChange: handlePasswordChange,
    setError: setPasswordError,
    reset: resetPassword,
  } = useForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ─── Handler: simpan profil ───────────────────────────
  async function handleSaveProfile() {
    setProfileFeedback({ type: "", message: "" });

    if (!profileValues.name.trim()) {
      setProfileError("name", "Nama tidak boleh kosong");
      return;
    }

    try {
      await api.put("/users/update", { name: profileValues.name.trim() });
      setProfileFeedback({ type: "success", message: "Profil berhasil diperbarui" });
      await logout();
    } catch (err) {
      const msg = err.response?.data?.error || "Gagal menyimpan profil";
      setProfileFeedback({ type: "error", message: msg });
    }
  }

  // ─── Handler: ganti password ──────────────────────────
  async function handleUpdatePassword() {
    setPasswordFeedback({ type: "", message: "" });
    let hasError = false;

    if (!passwordValues.currentPassword) {
      setPasswordError("currentPassword", "Kata sandi lama wajib diisi");
      hasError = true;
    }
    if (!passwordValues.newPassword) {
      setPasswordError("newPassword", "Kata sandi baru wajib diisi");
      hasError = true;
    } else if (passwordValues.newPassword.length < 6) {
      setPasswordError("newPassword", "Minimal 6 karakter");
      hasError = true;
    }
    if (!passwordValues.confirmPassword) {
      setPasswordError("confirmPassword", "Konfirmasi kata sandi wajib diisi");
      hasError = true;
    } else if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setPasswordError("confirmPassword", "Konfirmasi kata sandi tidak cocok");
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await api.put("/users/update-password", {
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
      setPasswordFeedback({ type: "success", message: res.data.message });
      resetPassword();
      await logout();
    } catch (err) {
      const msg = err.response?.data?.error || "Gagal update password";
      setPasswordFeedback({ type: "error", message: msg });
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 text-sm">
          Kelola preferensi akun dan aplikasi Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigasi Pengaturan Samping */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-white text-[#FB7D00] shadow-sm border border-orange-100"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <User size={18} />
            <span>Profil Akun</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === "notifications"
                ? "bg-white text-[#FB7D00] shadow-sm border border-orange-100"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Bell size={18} />
            <span>Notifikasi</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 font-semibold rounded-xl transition-all ${
              activeTab === "security"
                ? "bg-white text-[#FB7D00] shadow-sm border border-orange-100"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Shield size={18} />
            <span>Keamanan</span>
          </button>
        </div>

        {/* Konten Dinamis berdasarkan Tab */}
        <div className="md:col-span-2 space-y-6">

          {/* TAB: PROFIL */}
          {activeTab === "profile" && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Informasi Profil
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Nama Lengkap
                  </label>
                  {/* ✅ terhubung ke useForm */}
                  <input
                    type="text"
                    name="name"
                    value={profileValues.name}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${
                      profileErrors.name ? "border-red-400" : "border-slate-200"
                    }`}
                  />
                  {profileErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{profileErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    defaultValue={user?.email}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>

                <FeedbackMessage type={profileFeedback.type} message={profileFeedback.message} />

                {/* ✅ onClick terhubung ke handler */}
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#FB7D00] text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </section>
          )}

          {/* TAB: NOTIFIKASI */}
          {activeTab === "notifications" && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Preferensi Notifikasi
              </h3>
              <div className="space-y-6">
                {[
                  { title: "Notifikasi Email", desc: "Dapatkan laporan harian melalui email", icon: <Mail size={18} /> },
                  { title: "Push Notification", desc: "Peringatan real-time di browser/hp", icon: <Smartphone size={18} /> },
                  { title: "Laporan Mingguan", desc: "Ringkasan statistik setiap hari Senin", icon: <Bell size={18} /> },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg text-[#FB7D00]">
                        {item.icon}
                      </div>
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
          {activeTab === "security" && (
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Keamanan Akun
              </h3>
              <div className="space-y-6">
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                    <Lock size={18} />
                    <span>Ganti Kata Sandi</span>
                  </div>

                  <div>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Kata sandi lama"
                      value={passwordValues.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        passwordErrors.currentPassword ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* ✅ newPassword terhubung ke useForm */}
                  <div>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Kata sandi baru"
                      value={passwordValues.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        passwordErrors.newPassword ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  {/* ✅ confirmPassword terhubung ke useForm */}
                  <div>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Konfirmasi kata sandi baru"
                      value={passwordValues.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                        passwordErrors.confirmPassword ? "border-red-400" : "border-slate-200"
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <FeedbackMessage type={passwordFeedback.type} message={passwordFeedback.message} />

                  {/* ✅ onClick terhubung ke handler */}
                  <button
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Memperbarui..." : "Update Password"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Autentikasi Dua Faktor (2FA)
                      </p>
                      <p className="text-xs text-slate-400">
                        Tambahkan lapisan keamanan ekstra
                      </p>
                    </div>
                  </div>
                  <button className="text-sm font-bold text-[#FB7D00]">
                    Aktifkan
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}