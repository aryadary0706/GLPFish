import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, BarChart2, Fish, TrendingUp, Download, ChevronRight,
  Filter, Clock, CheckCircle, AlertCircle, X, SlidersHorizontal,
  ArrowUpRight, Activity, ShieldCheck,
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API — admin dashboard
// GET /api/admin/summary?dari=&sampai=
// GET /api/admin/chart?dari=&sampai=
// GET /api/admin/top-users?limit=5
// GET /api/admin/recent-batches?limit=8
// GET /api/admin/activity?limit=10
// GET /api/admin/recap?dari=&sampai=&jenis=&status=  → xlsx binary
// ═══════════════════════════════════════════════════════════════

// ─── Mock chart data (30 hari) ────────────────────────────────
const CHART_DATA = [
  { tgl:'1 Mei',  inspeksi:52,  gradeA:33 },{ tgl:'2 Mei',  inspeksi:68,  gradeA:44 },
  { tgl:'3 Mei',  inspeksi:45,  gradeA:28 },{ tgl:'4 Mei',  inspeksi:71,  gradeA:47 },
  { tgl:'5 Mei',  inspeksi:88,  gradeA:58 },{ tgl:'6 Mei',  inspeksi:63,  gradeA:40 },
  { tgl:'7 Mei',  inspeksi:79,  gradeA:51 },{ tgl:'8 Mei',  inspeksi:55,  gradeA:34 },
  { tgl:'9 Mei',  inspeksi:92,  gradeA:62 },{ tgl:'10 Mei', inspeksi:74,  gradeA:50 },
  { tgl:'11 Mei', inspeksi:48,  gradeA:30 },{ tgl:'12 Mei', inspeksi:83,  gradeA:56 },
  { tgl:'13 Mei', inspeksi:67,  gradeA:43 },{ tgl:'14 Mei', inspeksi:95,  gradeA:64 },
  { tgl:'15 Mei', inspeksi:58,  gradeA:37 },{ tgl:'16 Mei', inspeksi:76,  gradeA:49 },
  { tgl:'17 Mei', inspeksi:84,  gradeA:55 },{ tgl:'18 Mei', inspeksi:61,  gradeA:39 },
  { tgl:'19 Mei', inspeksi:90,  gradeA:60 },{ tgl:'20 Mei', inspeksi:73,  gradeA:48 },
  { tgl:'21 Mei', inspeksi:96,  gradeA:65 },{ tgl:'22 Mei', inspeksi:64,  gradeA:41 },
  { tgl:'23 Mei', inspeksi:88,  gradeA:57 },{ tgl:'24 Mei', inspeksi:78,  gradeA:52 },
  { tgl:'25 Mei', inspeksi:54,  gradeA:35 },{ tgl:'26 Mei', inspeksi:82,  gradeA:54 },
  { tgl:'27 Mei', inspeksi:69,  gradeA:45 },{ tgl:'28 Mei', inspeksi:91,  gradeA:61 },
  { tgl:'29 Mei', inspeksi:75,  gradeA:50 },{ tgl:'30 Mei', inspeksi:87,  gradeA:58 },
]

const MOCK_SUMMARY = {
  totalPengguna:12, totalBatch:24, totalInspeksi:2148,
  gradeAPercent:62, rejectPercent:11, newUsersThisMonth:3,
}

const MOCK_RECENT_BATCHES = [
  { id:'B-2406-015', tanggal:'2026-05-24', jenis:'Kakap merah',       status:'completed',  total:120, gradeA:78, gradeB:29, gradeC:13, berat:48.5, createdBy:'Budi Santoso' },
  { id:'B-2406-014', tanggal:'2026-05-23', jenis:'Kakap merah',       status:'incomplete', total:88,  gradeA:54, gradeB:22, gradeC:12, berat:34.1, createdBy:'Sari Dewi' },
  { id:'B-2406-013', tanggal:'2026-05-22', jenis:'Tuna sirip kuning', status:'completed',  total:142, gradeA:91, gradeB:38, gradeC:13, berat:71.8, createdBy:'Ahmad Fauzan' },
  { id:'B-2406-012', tanggal:'2026-05-22', jenis:'Kerapu',            status:'completed',  total:64,  gradeA:40, gradeB:18, gradeC:6,  berat:22.4, createdBy:'Rina Kusuma' },
  { id:'B-2406-011', tanggal:'2026-05-21', jenis:'Kakap merah',       status:'completed',  total:96,  gradeA:62, gradeB:24, gradeC:10, berat:38.6, createdBy:'Budi Santoso' },
  { id:'B-2406-010', tanggal:'2026-05-20', jenis:'Bandeng',           status:'completed',  total:115, gradeA:71, gradeB:30, gradeC:14, berat:42.0, createdBy:'Doni Prasetyo' },
]

export const MOCK_USERS = [
  { id:'u1', name:'Budi Santoso',  email:'budi@ganusa.id',   totalInspeksi:412, gradeAPercent:68, lastActive:'30 Mei 2026', joined:'01 Jan 2026', status:'Aktif' },
  { id:'u2', name:'Sari Dewi',     email:'sari@ganusa.id',   totalInspeksi:388, gradeAPercent:71, lastActive:'29 Mei 2026', joined:'05 Jan 2026', status:'Aktif' },
  { id:'u3', name:'Ahmad Fauzan',  email:'ahmad@ganusa.id',  totalInspeksi:305, gradeAPercent:59, lastActive:'30 Mei 2026', joined:'10 Jan 2026', status:'Aktif' },
  { id:'u4', name:'Rina Kusuma',   email:'rina@ganusa.id',   totalInspeksi:276, gradeAPercent:65, lastActive:'28 Mei 2026', joined:'15 Feb 2026', status:'Aktif' },
  { id:'u5', name:'Doni Prasetyo', email:'doni@ganusa.id',   totalInspeksi:241, gradeAPercent:61, lastActive:'27 Mei 2026', joined:'20 Feb 2026', status:'Aktif' },
  { id:'u6', name:'Mega Putri',    email:'mega@ganusa.id',   totalInspeksi:198, gradeAPercent:55, lastActive:'26 Mei 2026', joined:'01 Mar 2026', status:'Aktif' },
  { id:'u7', name:'Hendra Wijaya', email:'hendra@ganusa.id', totalInspeksi:175, gradeAPercent:70, lastActive:'25 Mei 2026', joined:'10 Mar 2026', status:'Aktif' },
  { id:'u8', name:'Tika Rahayu',   email:'tika@ganusa.id',   totalInspeksi:153, gradeAPercent:58, lastActive:'24 Mei 2026', joined:'01 Apr 2026', status:'Aktif' },
]

const MOCK_ACTIVITY = [
  { id:'a1',  type:'batch_complete', actor:'Budi Santoso',  action:'menyelesaikan grading',   target:'Batch B-2406-015',  detail:'120 ikan • Kakap merah',      time:'14:32', date:'Hari ini' },
  { id:'a2',  type:'inspection',     actor:'Sari Dewi',     action:'menginspeksi',             target:'15 ikan baru',      detail:'Batch B-2406-014',             time:'13:15', date:'Hari ini' },
  { id:'a3',  type:'batch_create',   actor:'Budi Santoso',  action:'membuat batch baru',       target:'B-2406-015',        detail:'Kakap merah • 120 ekor',       time:'08:00', date:'Hari ini' },
  { id:'a4',  type:'user_register',  actor:'System',        action:'pengguna baru terdaftar',  target:'Tika Rahayu',       detail:'tika@ganusa.id',               time:'17:45', date:'Kemarin' },
  { id:'a5',  type:'batch_complete', actor:'Ahmad Fauzan',  action:'menyelesaikan grading',   target:'Batch B-2406-013',  detail:'142 ikan • Tuna sirip kuning', time:'15:20', date:'Kemarin' },
  { id:'a6',  type:'inspection',     actor:'Ahmad Fauzan',  action:'menginspeksi',             target:'22 ikan baru',      detail:'Batch B-2406-013',             time:'14:05', date:'Kemarin' },
  { id:'a7',  type:'batch_create',   actor:'Sari Dewi',     action:'membuat batch baru',       target:'B-2406-014',        detail:'Kakap merah • 120 ekor',       time:'09:30', date:'Kemarin' },
]

const TYPE_STYLE = {
  batch_complete: { dot:'bg-green-500',  icon:<CheckCircle size={13} className="text-green-600" />,  label:'Selesai' },
  inspection:     { dot:'bg-blue-500',   icon:<Fish size={13} className="text-blue-500" />,           label:'Inspeksi' },
  batch_create:   { dot:'bg-orange-400', icon:<AlertCircle size={13} className="text-orange-500" />,  label:'Batch baru' },
  user_register:  { dot:'bg-purple-500', icon:<Users size={13} className="text-purple-500" />,        label:'User baru' },
}

function GradeBar({ a, b, c, total }) {
  const pA = total > 0 ? (a / total) * 100 : 0
  const pB = total > 0 ? (b / total) * 100 : 0
  const pC = total > 0 ? (c / total) * 100 : 0
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-20 bg-gray-100">
      {pA > 0 && <div style={{ width:`${pA}%` }} className="bg-green-500" />}
      {pB > 0 && <div style={{ width:`${pB}%` }} className="bg-orange-400" />}
      {pC > 0 && <div style={{ width:`${pC}%` }} className="bg-red-400" />}
    </div>
  )
}

// ─── Filter Popup ─────────────────────────────────────────────
const JENIS_OPTS   = ['Semua','Kakap merah','Tuna sirip kuning','Kerapu','Bandeng']
const STATUS_OPTS  = ['Semua','Completed','Incomplete']

function FilterPopup({ open, onClose, filters, onChange, onApply, onReset, anchorRef }) {
  const popupRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl w-80 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-orange-500" /> Filter Data
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
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
        <button onClick={onReset}
          className="flex-1 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          Reset
        </button>
        <button onClick={() => { onApply(); onClose() }}
          className="flex-1 py-2 text-sm font-semibold text-white bg-[#f47d31] rounded-xl hover:bg-[#e06a20] transition-colors">
          Terapkan
        </button>
      </div>
    </div>
  )
}

// ─── Custom Tooltip untuk chart ────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const today        = new Date().toISOString().split('T')[0]
  const thirtyAgo    = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const filterBtnRef = useRef(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ dari: thirtyAgo, sampai: today, jenis: 'Semua', status: 'Semua' })
  const [applied,  setApplied] = useState({ dari: thirtyAgo, sampai: today, jenis: 'Semua', status: 'Semua' })

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

  const filteredBatches = MOCK_RECENT_BATCHES.filter(b => {
    if (applied.jenis  !== 'Semua' && b.jenis   !== applied.jenis)                     return false
    if (applied.status !== 'Semua' && b.status   !== applied.status.toLowerCase())     return false
    if (b.tanggal < applied.dari || b.tanggal > applied.sampai)                        return false
    return true
  })

  function exportRecap() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Rekap Admin GLP Fish'],
      ['Periode', `${applied.dari} s/d ${applied.sampai}`],
      [],
      ['Metrik','Nilai'],
      ['Total Pengguna', MOCK_SUMMARY.totalPengguna],
      ['Total Batch',    MOCK_SUMMARY.totalBatch],
      ['Total Inspeksi', MOCK_SUMMARY.totalInspeksi],
      ['Grade A (%)',    MOCK_SUMMARY.gradeAPercent],
    ]), 'Ringkasan')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Batch ID','Tanggal','Jenis','Status','Total','Grade A','Grade B','Grade C','Berat (kg)','Oleh'],
      ...filteredBatches.map(b => [b.id,b.tanggal,b.jenis,b.status,b.total,b.gradeA,b.gradeB,b.gradeC,b.berat,b.createdBy]),
    ]), 'Batch')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Nama','Email','Inspeksi','Grade A%','Terakhir Aktif'],
      ...MOCK_USERS.map(u => [u.name,u.email,u.totalInspeksi,u.gradeAPercent,u.lastActive]),
    ]), 'Pengguna')

    XLSX.writeFile(wb, `rekap-admin-${applied.dari}-${applied.sampai}.xlsx`)
  }

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
            <p className="text-sm text-gray-500 mt-1">
              {applied.dari} — {applied.sampai}
            </p>
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
                <Filter size={15} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <FilterPopup
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                filters={filters}
                onChange={changeFilter}
                onApply={applyFilter}
                onReset={resetFilter}
                anchorRef={filterBtnRef}
              />
            </div>

            <button onClick={exportRecap}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f47d31] text-white text-sm font-semibold rounded-xl hover:bg-[#e06a20] transition-colors shadow-sm">
              <Download size={15} />
              Export Rekap
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon:<Users size={20} />,     color:'bg-purple-50 text-purple-600', label:'Total Pengguna',  value:MOCK_SUMMARY.totalPengguna,                     sub:`+${MOCK_SUMMARY.newUsersThisMonth} bulan ini` },
            { icon:<BarChart2 size={20} />, color:'bg-orange-50 text-orange-500', label:'Total Batch',     value:MOCK_SUMMARY.totalBatch,                          sub:`${filteredBatches.length} dalam filter` },
            { icon:<Fish size={20} />,      color:'bg-blue-50 text-blue-500',     label:'Total Inspeksi',  value:MOCK_SUMMARY.totalInspeksi.toLocaleString('id-ID'), sub:'ikan diproses' },
            { icon:<TrendingUp size={20} />,color:'bg-green-50 text-green-600',   label:'Grade A Avg',     value:`${MOCK_SUMMARY.gradeAPercent}%`,                 sub:`Reject ${MOCK_SUMMARY.rejectPercent}%` },
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
              <p className="text-xs text-gray-400 mt-0.5">Jumlah ikan diinspeksi per hari (30 hari terakhir)</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-orange-400 rounded inline-block" /> Total Inspeksi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-green-500 rounded inline-block" /> Grade A</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{ top:4, right:8, left:-20, bottom:0 }}>
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
              <XAxis dataKey="tgl" tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="inspeksi" name="Inspeksi" stroke="#f47d31" strokeWidth={2} fill="url(#gInspeksi)" dot={false} />
              <Area type="monotone" dataKey="gradeA"   name="Grade A"  stroke="#22c55e" strokeWidth={2} fill="url(#gGradeA)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom grid: batch table + activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

          {/* Batch Terkini (2/3) */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Batch Terkini</h2>
              <button
                onClick={() => navigate('/statistic')}
                className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-700 transition-colors"
              >
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
                    <th className="px-5 py-3 text-left">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-xs">Tidak ada batch cocok filter.</td></tr>
                  )}
                  {filteredBatches.map(b => (
                    <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-orange-600 text-xs">{b.id}</td>
                      <td className="px-3 py-3 text-gray-700 text-xs">{b.jenis}</td>
                      <td className="px-3 py-3">
                        {b.status === 'completed'
                          ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">Done</span>
                          : <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">Proses</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-bold text-gray-700">{b.total}</td>
                      <td className="px-3 py-3"><GradeBar a={b.gradeA} b={b.gradeB} c={b.gradeC} total={b.total} /></td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{b.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aktivitas Terbaru (1/3) — timeline */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Aktivitas Terbaru</h2>
              <Activity size={14} className="text-gray-400" />
            </div>

            <div className="px-5 py-4 space-y-0 overflow-y-auto max-h-[380px]">
              {Object.entries(
                MOCK_ACTIVITY.reduce((acc, a) => {
                  (acc[a.date] = acc[a.date] || []).push(a); return acc
                }, {})
              ).map(([date, items]) => (
                <div key={date}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide py-2">{date}</p>
                  <div className="relative">
                    {/* vertical line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />
                    <div className="space-y-4 pl-6">
                      {items.map(a => {
                        const s = TYPE_STYLE[a.type] || TYPE_STYLE.inspection
                        return (
                          <div key={a.id} className="relative">
                            {/* dot */}
                            <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${s.dot}`} />
                            <div>
                              <p className="text-xs text-gray-700 leading-snug">
                                <span className="font-semibold text-gray-800">{a.actor}</span>
                                {' '}{a.action}{' '}
                                <span className="font-semibold text-orange-600">{a.target}</span>
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{a.detail} · {a.time}</p>
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
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#f47d31] rounded-xl hover:bg-[#e06a20] transition-colors"
            >
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
                {MOCK_USERS.slice(0, 5).map((u, i) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm">{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span>
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
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-700 transition-colors"
                      >
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
    </div>
  )
}
