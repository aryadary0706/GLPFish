import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Fish, TrendingUp, BarChart2,
  Mail, Calendar, Clock, CheckCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { MOCK_USERS } from './AdminPage'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API
// GET /api/admin/users/:id
//   Response: { user: { ...profile, chart: [...], recentInspections: [...] } }
// ═══════════════════════════════════════════════════════════════

const USER_CHARTS = {
  u1: [52,68,45,71,88,63,79,55,92,74,48,83,67,95,58],
  u2: [40,55,62,48,75,69,82,58,70,61,85,73,67,80,72],
  u3: [35,42,55,60,48,70,52,65,58,72,63,55,68,74,61],
  u4: [28,38,44,52,60,48,55,63,70,58,65,72,60,68,74],
  u5: [32,44,50,58,65,55,68,62,72,65,70,60,58,65,70],
  u6: [20,28,35,42,50,45,55,48,60,52,58,48,55,62,58],
  u7: [25,32,40,48,55,50,58,52,65,60,68,58,65,72,65],
  u8: [18,25,32,38,45,40,50,45,55,48,52,45,50,58,55],
}

const USER_INSPECTIONS = {
  u1: [
    { id:'i1', batch:'B-2406-015', jenis:'Kakap merah',       grade:'A', waktu:'30 Mei 2026, 14:30' },
    { id:'i2', batch:'B-2406-015', jenis:'Kakap merah',       grade:'A', waktu:'30 Mei 2026, 14:28' },
    { id:'i3', batch:'B-2406-011', jenis:'Kakap merah',       grade:'B', waktu:'21 Mei 2026, 10:15' },
    { id:'i4', batch:'B-2406-011', jenis:'Kakap merah',       grade:'A', waktu:'21 Mei 2026, 10:12' },
    { id:'i5', batch:'B-2406-006', jenis:'Kakap merah',       grade:'A', waktu:'17 Mei 2026, 09:45' },
  ],
  u2: [
    { id:'i1', batch:'B-2406-014', jenis:'Kakap merah',       grade:'B', waktu:'30 Mei 2026, 13:10' },
    { id:'i2', batch:'B-2406-014', jenis:'Kakap merah',       grade:'A', waktu:'30 Mei 2026, 13:08' },
    { id:'i3', batch:'B-2406-009', jenis:'Kakap merah',       grade:'A', waktu:'20 Mei 2026, 11:20' },
  ],
  u3: [
    { id:'i1', batch:'B-2406-013', jenis:'Tuna sirip kuning', grade:'A', waktu:'29 Mei 2026, 14:00' },
    { id:'i2', batch:'B-2406-013', jenis:'Tuna sirip kuning', grade:'A', waktu:'29 Mei 2026, 13:55' },
    { id:'i3', batch:'B-2406-008', jenis:'Tuna sirip kuning', grade:'B', waktu:'19 Mei 2026, 09:30' },
  ],
}

const GRADE_COLOR = { A:'bg-green-100 text-green-700', B:'bg-orange-100 text-orange-600', C:'bg-red-100 text-red-600' }

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

  const user = MOCK_USERS.find(u => u.id === userId)
  if (!user) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Pengguna tidak ditemukan.
    </div>
  )

  const rawChart = USER_CHARTS[userId] || Array(15).fill(30)
  const chartData = rawChart.map((v, i) => ({ hari: i + 1, inspeksi: v }))
  const recentInspections = USER_INSPECTIONS[userId] || []

  const gradeACount = recentInspections.filter(i => i.grade === 'A').length

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
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span>Status: <span className="font-semibold text-green-600">{user.status}</span></span>
              </div>
            </div>
          </div>

          {/* Stats + chart */}
          <div className="lg:col-span-2 space-y-4">
            {/* 3 mini stat cards */}
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
                <p className="text-2xl font-bold text-orange-500">
                  #{MOCK_USERS.sort((a,b) => b.totalInspeksi - a.totalInspeksi).findIndex(u => u.id === userId) + 1}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5 flex items-center justify-center gap-1">
                  <BarChart2 size={10} /> Peringkat
                </p>
              </div>
            </div>

            {/* Mini activity chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-4">Aktivitas Inspeksi (15 hari terakhir)</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f47d31" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f47d31" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="hari" tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="inspeksi" stroke="#f47d31" strokeWidth={2} fill="url(#gUser)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent inspections */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Inspeksi Terbaru</h2>
            {recentInspections.length > 0 && (
              <span className="text-xs text-gray-400">{recentInspections.length} entri</span>
            )}
          </div>

          {recentInspections.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada data inspeksi.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Batch</th>
                  <th className="px-3 py-3 text-left">Jenis Ikan</th>
                  <th className="px-3 py-3 text-left">Grade</th>
                  <th className="px-6 py-3 text-left">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.map(ins => (
                  <tr key={ins.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-orange-600 text-xs">{ins.batch}</td>
                    <td className="px-3 py-3 text-gray-700 text-xs">{ins.jenis}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${GRADE_COLOR[ins.grade] || 'bg-gray-100 text-gray-600'}`}>
                        Grade {ins.grade}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs flex items-center gap-1">
                      <Clock size={11} /> {ins.waktu}
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
