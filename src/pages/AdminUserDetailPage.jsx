import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Fish, TrendingUp, BarChart2,
  Mail, Calendar, Clock,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AdminService } from '../services/AdminServices'

function buildChart(recentBatches) {
  const today = new Date()
  const days  = Array.from({ length: 15 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (14 - i))
    return d.toISOString().slice(0, 10)
  })
  const byDate = {}
  recentBatches.forEach(b => {
    const d = b.createdAt?.slice(0, 10)
    if (d) byDate[d] = (byDate[d] || 0) + (b.totalInspeksi || 0)
  })
  return days.map((d, i) => ({ hari: i + 1, inspeksi: byDate[d] || 0 }))
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700">Hari ke-{label}</p>
      <p className="text-orange-500 font-semibold">Inspeksi: {payload[0]?.value}</p>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const navigate   = useNavigate()

  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    AdminService.getUserDetail(userId)
      .then(data => setUser(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Memuat data pengguna...</div>
  )
  if (error) return (
    <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{error}</div>
  )
  if (!user) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Pengguna tidak ditemukan.</div>
  )

  const chartData     = buildChart(user.recentBatches || [])
  const recentBatches = user.recentBatches || []

  return (
    <div className="flex-1 bg-[#f8f9fa] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <button onClick={() => navigate('/admin')} className="hover:text-gray-800">Admin</button>
          <ChevronRight size={12} />
          <button onClick={() => navigate('/admin/users')} className="hover:text-gray-800">Pengguna</button>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-medium">{user.name}</span>
        </div>

        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke daftar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-bold mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Mail size={11} /> {user.email}
            </p>
            <div className="w-full border-t border-gray-100 mt-5 pt-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={13} className="text-gray-400" />
                <span>Bergabung: <span className="font-semibold text-gray-700">{user.joined}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={13} className="text-gray-400" />
                <span>Terakhir aktif: <span className="font-semibold text-gray-700">{user.lastActive}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full inline-block ${user.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Status: <span className={`font-semibold ${user.status === 'Aktif' ? 'text-green-600' : 'text-gray-400'}`}>{user.status}</span></span>
              </div>
            </div>
          </div>

          {/* Stats + chart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-gray-900">{user.totalInspeksi.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5 flex items-center justify-center gap-1">
                  <Fish size={10} /> Total Inspeksi
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-green-600">{user.gradeAPercent}%</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5 flex items-center justify-center gap-1">
                  <TrendingUp size={10} /> Grade A Avg
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-orange-500">{user.totalBatch}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5 flex items-center justify-center gap-1">
                  <BarChart2 size={10} /> Total Batch
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-4">Aktivitas Inspeksi (15 hari terakhir)</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f47d31" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f47d31" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="hari" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="inspeksi" stroke="#f47d31" strokeWidth={2} fill="url(#gUser)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent batches */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Batch Terbaru</h2>
            {recentBatches.length > 0 && (
              <span className="text-xs text-gray-400">{recentBatches.length} entri</span>
            )}
          </div>

          {recentBatches.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada data batch.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Batch ID</th>
                  <th className="px-3 py-3 text-left">Jenis Ikan</th>
                  <th className="px-3 py-3 text-right">Inspeksi</th>
                  <th className="px-3 py-3 text-right">Grade A</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map(b => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-orange-600 text-xs">{b.id}</td>
                    <td className="px-3 py-3 text-gray-700 text-xs">{b.fishCategory || '-'}</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-800 text-xs">{b.totalInspeksi}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${b.gradeAPercent >= 65 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                        {b.gradeAPercent}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {b.status === 'done'
                        ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">Selesai</span>
                        : b.status === 'failed'
                          ? <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">Gagal</span>
                          : <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">Proses</span>
                      }
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      <span className="flex items-center gap-1"><Clock size={11} /> {b.tanggal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
