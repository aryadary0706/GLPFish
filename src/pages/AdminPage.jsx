import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Users, BarChart2, Fish, TrendingUp, Download, ChevronRight,
  Filter, CheckCircle, AlertCircle, X, SlidersHorizontal,
  ArrowUpRight, Activity, ShieldCheck, Ban,
} from 'lucide-react'
import { AdminService } from '../services/AdminServices'
import RejectBatchModal from '../components/ui/RejectBatchModal'

const JENIS_OPTS  = ['Semua', 'Kakap merah', 'Tuna sirip kuning', 'Kerapu', 'Bandeng']
const STATUS_OPTS = ['Semua', 'Selesai', 'Proses', 'Gagal']

const TYPE_STYLE = {
  USER_CREATED:       { dot: 'bg-purple-500', icon: <Users size={13} className="text-purple-500" />,         label: 'User baru' },
  BATCH_CREATED:      { dot: 'bg-orange-400', icon: <AlertCircle size={13} className="text-orange-500" />,   label: 'Batch baru' },
  IMAGE_UPLOADED:     { dot: 'bg-blue-500',   icon: <Fish size={13} className="text-blue-500" />,             label: 'Inspeksi' },
  PREDICTION_CREATED: { dot: 'bg-green-500',  icon: <CheckCircle size={13} className="text-green-600" />,    label: 'Selesai' },
}

function getRelativeDay(isoStr) {
  if (!isoStr) return '-'
  const todayStr = new Date().toISOString().slice(0, 10)
  const yestStr  = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  const dayStr   = isoStr.slice(0, 10)
  if (dayStr === todayStr) return 'Hari ini'
  if (dayStr === yestStr)  return 'Kemarin'
  return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatChartLabel(tanggal) {
  const d = new Date(tanggal + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function GradeBar({ a, b, c, total }) {
  const pA = total > 0 ? (a / total) * 100 : 0
  const pB = total > 0 ? (b / total) * 100 : 0
  const pC = total > 0 ? (c / total) * 100 : 0
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-20 bg-gray-100">
      {pA > 0 && <div style={{ width: `${pA}%` }} className="bg-green-500" />}
      {pB > 0 && <div style={{ width: `${pB}%` }} className="bg-orange-400" />}
      {pC > 0 && <div style={{ width: `${pC}%` }} className="bg-red-400" />}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'done')    return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">Selesai</span>
  if (status === 'failed')  return <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">Gagal</span>
  return <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">Proses</span>
}

function FilterPopup({ open, onClose, filters, onChange, onApply, onReset, anchorRef }) {
  const popupRef = useRef(null)
  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) onClose()
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])
  if (!open) return null
  return (
    <div ref={popupRef} className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl w-80 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-orange-500" /> Filter Data
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Dari Tanggal</label>
          <input type="date" value={filters.dari} onChange={e => onChange('dari', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Sampai Tanggal</label>
          <input type="date" value={filters.sampai} onChange={e => onChange('sampai', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Jenis Ikan</label>
          <select value={filters.jenis} onChange={e => onChange('jenis', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400">
            {JENIS_OPTS.map(j => <option key={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Status Batch</label>
          <select value={filters.status} onChange={e => onChange('status', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400">
            {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onReset} className="flex-1 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Reset</button>
        <button onClick={() => { onApply(); onClose() }} className="flex-1 py-2 text-sm font-semibold text-white bg-[#f47d31] rounded-xl hover:bg-[#e06a20] transition-colors">Terapkan</button>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const navigate   = useNavigate()
  const today      = new Date().toISOString().split('T')[0]
  const thirtyAgo  = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const filterBtnRef = useRef(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters,  setFilters]  = useState({ dari: thirtyAgo, sampai: today, jenis: 'Semua', status: 'Semua' })
  const [applied,  setApplied]  = useState({ dari: thirtyAgo, sampai: today, jenis: 'Semua', status: 'Semua' })

  const [summary,   setSummary]   = useState(null)
  const [chartData, setChartData] = useState([])
  const [batches,   setBatches]   = useState([])
  const [topUsers,  setTopUsers]  = useState([])
  const [activity,  setActivity]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [error,     setError]     = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  async function handleConfirmReject(batch) {
    await AdminService.rejectBatch(batch.id)
    setBatches(prev => prev.map(b =>
      b.id === batch.id ? { ...b, preprocessedStatus: 'rejected' } : b
    ))
  }

  useEffect(() => {
    const params = { dari: applied.dari, sampai: applied.sampai }
    const chartParams = { ...params, jenis: applied.jenis, status: applied.status }
    setLoading(true)
    setError(null)
    Promise.all([
      AdminService.getSummary(params),
      AdminService.getChart(chartParams),
      AdminService.getRecentBatches({ limit: 50 }),
      AdminService.getTopUsers({ limit: 5 }),
      AdminService.getActivity({ limit: 10 }),
    ])
      .then(([s, c, rb, tu, a]) => {
        setSummary(s)
        setChartData((c || []).map(d => ({
          tgl:      formatChartLabel(d.tanggal),
          inspeksi: d.totalInspeksi,
          gradeA:   d.gradeA,
        })))
        setBatches(rb || [])
        setTopUsers(tu || [])
        setActivity(a || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [applied.dari, applied.sampai, applied.jenis, applied.status])

  function changeFilter(key, val) { setFilters(prev => ({ ...prev, [key]: val })) }
  function applyFilter()  { setApplied({ ...filters }) }
  function resetFilter()  {
    const def = { dari: thirtyAgo, sampai: today, jenis: 'Semua', status: 'Semua' }
    setFilters(def); setApplied(def)
  }

  const activeFilterCount = [
    applied.dari !== thirtyAgo, applied.sampai !== today,
    applied.jenis !== 'Semua',  applied.status !== 'Semua',
  ].filter(Boolean).length

  const filteredBatches = batches.filter(b => {
    const bDate = b.createdAt?.slice(0, 10)
    if (applied.jenis !== 'Semua' && b.fishCategory !== applied.jenis) return false
    if (applied.status === 'Selesai' && b.status !== 'done')                         return false
    if (applied.status === 'Proses'  && ['done', 'failed'].includes(b.status))       return false
    if (applied.status === 'Gagal'   && b.status !== 'failed')                       return false
    if (bDate && bDate < applied.dari)   return false
    if (bDate && bDate > applied.sampai) return false
    return true
  })

  const groupedActivity = activity.reduce((acc, a) => {
    const label = getRelativeDay(a.createdAt)
    ;(acc[label] = acc[label] || []).push(a)
    return acc
  }, {})

  async function exportRecap() {
    setExportLoading(true)
    try {
      await AdminService.saveRecap(
        { dari: applied.dari, sampai: applied.sampai },
        `rekap-admin-${applied.dari}-${applied.sampai}.xlsx`
      )
    } catch (e) {
      alert('Gagal mengekspor: ' + e.message)
    } finally {
      setExportLoading(false)
    }
  }

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-sm">
        <p className="text-sm font-semibold text-red-600">Gagal memuat data admin</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600">Coba lagi</button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 bg-[#f8f9fa] min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ShieldCheck size={14} className="text-orange-500" />
              <span>Admin</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-1">{applied.dari} — {applied.sampai}</p>
          </div>
          <div className="flex items-center gap-3 relative">
            <div ref={filterBtnRef} className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border rounded-xl transition-colors ${
                  filterOpen || activeFilterCount > 0
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={15} /> Filter
                {activeFilterCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <FilterPopup
                open={filterOpen} onClose={() => setFilterOpen(false)}
                filters={filters} onChange={changeFilter}
                onApply={applyFilter} onReset={resetFilter}
                anchorRef={filterBtnRef}
              />
            </div>
            <button
              onClick={exportRecap}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f47d31] text-white text-sm font-semibold rounded-xl hover:bg-[#e06a20] transition-colors shadow-sm disabled:opacity-60"
            >
              <Download size={15} />
              {exportLoading ? 'Mengunduh...' : 'Export Rekap'}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: <Users size={20} />,      color: 'bg-purple-50 text-purple-600', label: 'Total Pengguna',
              value: loading ? '—' : (summary?.totalPengguna ?? '—'),
              sub:   loading ? '' : `+${summary?.newUsersThisMonth ?? 0} bulan ini` },
            { icon: <BarChart2 size={20} />,  color: 'bg-orange-50 text-orange-500', label: 'Total Batch',
              value: loading ? '—' : (summary?.totalBatch ?? '—'),
              sub:   `${filteredBatches.length} dalam filter` },
            { icon: <Fish size={20} />,       color: 'bg-blue-50 text-blue-500',     label: 'Total Inspeksi',
              value: loading ? '—' : (summary?.totalInspeksi?.toLocaleString('id-ID') ?? '—'),
              sub:   'ikan diproses' },
            { icon: <TrendingUp size={20} />, color: 'bg-green-50 text-green-600',   label: 'Grade A Avg',
              value: loading ? '—' : `${summary?.gradeAPercent ?? '—'}%`,
              sub:   loading ? '' : `Reject ${summary?.rejectPercent ?? 0}%` },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
              <div className={`p-3 rounded-xl ${c.color.split(' ')[0]}`}>
                <span className={c.color.split(' ')[1]}>{c.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{c.label}</p>
                {c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Tren Inspeksi</h2>
              <p className="text-xs text-gray-400 mt-0.5">Jumlah ikan diinspeksi per hari pada periode ini</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-orange-400 rounded inline-block" /> Total Inspeksi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-green-500 rounded inline-block" /> Grade A</span>
            </div>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">Memuat...</div>
          ) : chartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">Tidak ada data pada periode ini.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInspeksi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f47d31" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f47d31" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGradeA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="tgl" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 6))} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="inspeksi" name="Inspeksi" stroke="#f47d31" strokeWidth={2} fill="url(#gInspeksi)" dot={false} />
                <Area type="monotone" dataKey="gradeA"   name="Grade A"  stroke="#22c55e" strokeWidth={2} fill="url(#gGradeA)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

          {/* Batch Terkini */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Batch Terkini</h2>
              <button onClick={() => navigate('/statistic')}
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-700 transition-colors">
                Lihat semua <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Batch ID</th>
                    <th className="px-3 py-3 text-left">Jenis</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-left">Distribusi</th>
                    <th className="px-3 py-3 text-left">Oleh</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-300 text-xs">Memuat...</td></tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-xs">Tidak ada batch cocok filter.</td></tr>
                  ) : filteredBatches.slice(0, 8).map(b => {
                    const gradeB = Math.max(0, (b.totalInspeksi || 0) - (b.gradeA || 0) - (b.reject || 0))
                    const isRejected = b.preprocessedStatus === 'rejected'
                    return (
                      <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-xs">
                          <button
                            onClick={() => navigate(`/batches/${b.id}/hasil`)}
                            className="font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                            title="Lihat detail hasil batch"
                          >
                            {b.id}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-gray-700 text-xs">{b.fishCategory || '-'}</td>
                        <td className="px-3 py-3">
                          {isRejected ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                              <Ban size={10} /> Ditolak
                            </span>
                          ) : (
                            <StatusBadge status={b.status} />
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-xs font-bold text-gray-700">{b.totalInspeksi}</td>
                        <td className="px-3 py-3">
                          <GradeBar a={b.gradeA || 0} b={gradeB} c={b.reject || 0} total={b.totalInspeksi || 0} />
                        </td>
                        <td className="px-3 py-3 text-gray-400 text-xs">{b.userName || '-'}</td>
                        <td className="px-5 py-3 text-right">
                          {isRejected ? (
                            <span className="text-[10px] font-semibold text-gray-300">—</span>
                          ) : (
                            <button
                              onClick={() => setRejectTarget(b)}
                              title="Tolak batch"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 rounded-lg transition-colors"
                            >
                              <Ban size={12} /> Tolak
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Aktivitas Terbaru</h2>
              <Activity size={14} className="text-gray-400" />
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[380px]">
              {loading ? (
                <p className="text-center text-gray-300 text-xs py-8">Memuat...</p>
              ) : activity.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">Belum ada aktivitas.</p>
              ) : Object.entries(groupedActivity).map(([date, items]) => (
                <div key={date}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide py-2">{date}</p>
                  <div className="relative">
                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />
                    <div className="space-y-4 pl-6">
                      {items.map(a => {
                        const s    = TYPE_STYLE[a.type] || TYPE_STYLE.IMAGE_UPLOADED
                        const time = new Date(a.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        return (
                          <div key={a.id} className="relative">
                            <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${s.dot}`} />
                            <div>
                              <p className="text-xs text-gray-700 leading-snug">
                                <span className="font-semibold text-gray-800">{a.userName}</span>
                                {' · '}<span className="text-gray-500">{a.title}</span>
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{a.description} · {time}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pengguna Teratas */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Pengguna Teratas</h2>
            <button onClick={() => navigate('/admin/users')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#f47d31] rounded-xl hover:bg-[#e06a20] transition-colors">
              Kelola User <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Nama</th>
                  <th className="px-3 py-3 text-left">Email</th>
                  <th className="px-3 py-3 text-right">Inspeksi</th>
                  <th className="px-3 py-3 text-right">Grade A</th>
                  <th className="px-6 py-3 text-left">Terakhir Aktif</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-300 text-xs">Memuat...</td></tr>
                ) : topUsers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-xs">Belum ada pengguna.</td></tr>
                ) : topUsers.map((u, i) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-800 text-xs">{u.name}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-3 py-3 text-right font-bold text-gray-800 text-xs">{u.totalInspeksi.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${u.gradeAPercent >= 65 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.gradeAPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{u.lastActive}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-700 transition-colors">
                        Detail <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <RejectBatchModal
        open={!!rejectTarget}
        batch={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}
