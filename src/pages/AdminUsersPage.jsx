import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Search, Filter,
  Users, Fish, TrendingUp, X, SlidersHorizontal,
} from 'lucide-react'
import { MOCK_USERS } from './AdminPage'

// ═══════════════════════════════════════════════════════════════
// KONTRAK API
// GET /api/admin/users?search=&status=&page=&limit=
//   Response: { users: [...], total: number }
// GET /api/admin/users/:id
//   Response: { user: { ...profile, batches: [...], recentInspections: [...] } }
// ═══════════════════════════════════════════════════════════════

function FilterPopup({ open, onClose, filters, onChange, onApply, onReset, anchorRef }) {
  const popupRef = useRef(null)
  useEffect(() => {
    function h(e) {
      if (popupRef.current && !popupRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) onClose()
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open, onClose, anchorRef])

  if (!open) return null
  return (
    <div ref={popupRef} className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl w-64 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-orange-500" /> Filter
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Grade A Min (%)</label>
          <input type="number" min="0" max="100" value={filters.gradeMin} onChange={e => onChange('gradeMin', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Min Inspeksi</label>
          <input type="number" min="0" value={filters.inspeksiMin} onChange={e => onChange('inspeksiMin', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onReset} className="flex-1 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Reset</button>
        <button onClick={() => { onApply(); onClose() }} className="flex-1 py-2 text-sm font-semibold text-white bg-[#f47d31] rounded-xl hover:bg-[#e06a20]">Terapkan</button>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const navigate   = useNavigate()
  const filterRef  = useRef(null)
  const [search,      setSearch]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const [filters,     setFilters]     = useState({ gradeMin: '', inspeksiMin: '' })
  const [applied,     setApplied]     = useState({ gradeMin: '', inspeksiMin: '' })

  function changeFilter(k, v) { setFilters(p => ({ ...p, [k]: v })) }
  function applyFilter()      { setApplied({ ...filters }) }
  function resetFilter()      { const d = { gradeMin:'', inspeksiMin:'' }; setFilters(d); setApplied(d) }

  const activeCount = [applied.gradeMin, applied.inspeksiMin].filter(Boolean).length

  const filtered = MOCK_USERS.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
                  !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (applied.gradeMin    && u.gradeAPercent   < Number(applied.gradeMin))    return false
    if (applied.inspeksiMin && u.totalInspeksi   < Number(applied.inspeksiMin)) return false
    return true
  })

  const totalInspeksi = MOCK_USERS.reduce((s, u) => s + u.totalInspeksi, 0)
  const avgGrade      = Math.round(MOCK_USERS.reduce((s, u) => s + u.gradeAPercent, 0) / MOCK_USERS.length)

  return (
    <div className="flex-1 bg-[#f8f9fa] min-h-screen p-8">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button onClick={() => navigate('/admin')} className="hover:text-gray-800 flex items-center gap-1">
            <ChevronLeft size={14} /> Admin
          </button>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-medium">Kelola Pengguna</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pengguna</h1>
          <span className="text-sm text-gray-500">{MOCK_USERS.length} pengguna terdaftar</span>
        </div>

        {/* Mini stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50"><Users size={18} className="text-purple-600" /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{MOCK_USERS.length}</p>
              <p className="text-xs text-gray-400">Total Pengguna</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50"><Fish size={18} className="text-blue-500" /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalInspeksi.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-400">Total Inspeksi</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50"><TrendingUp size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xl font-bold text-gray-900">{avgGrade}%</p>
              <p className="text-xs text-gray-400">Rata-rata Grade A</p>
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              />
            </div>

            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-xl transition-colors ${
                  filterOpen || activeCount > 0
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={14} /> Filter
                {activeCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>
                )}
              </button>
              <FilterPopup
                open={filterOpen} onClose={() => setFilterOpen(false)}
                filters={filters} onChange={changeFilter}
                onApply={applyFilter} onReset={resetFilter}
                anchorRef={filterRef}
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Nama</th>
                <th className="px-3 py-3 text-left">Email</th>
                <th className="px-3 py-3 text-right">Inspeksi</th>
                <th className="px-3 py-3 text-right">Grade A</th>
                <th className="px-3 py-3 text-left">Bergabung</th>
                <th className="px-3 py-3 text-left">Terakhir Aktif</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Tidak ada pengguna cocok.</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm">{i < 3 ? ['🥇','🥈','🥉'][i] : <span className="text-gray-400 text-xs">{i+1}</span>}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800 text-xs">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-3 py-3 text-right font-bold text-gray-800 text-xs">{u.totalInspeksi.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${u.gradeAPercent >= 65 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {u.gradeAPercent}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs">{u.joined}</td>
                  <td className="px-3 py-3 text-gray-400 text-xs">{u.lastActive}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-700 transition-colors whitespace-nowrap"
                    >
                      Lihat Detail <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
