import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useDistribusi } from '@/hooks/useDistribusi'
import { useAuth } from '@/hooks/useAuth'

const PER_PAGE = 7

const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const CURRENT_MONTH = MONTHS_ID[new Date().getMonth()]
const CURRENT_YEAR = new Date().getFullYear()

// ─── Distribusi bar mini ──────────────────────────────────────────────────────
function DistribusiBar({ gradeA, gradeB, gradeC, total }) {
  const pA = (gradeA / total) * 100
  const pB = (gradeB / total) * 100
  const pC = (gradeC / total) * 100
  return (
    <div className="flex items-center h-2.5 w-32 gap-[2px]">
      <div style={{ width: `${pA}%` }} className="h-full bg-green-500 rounded-l-full" />
      <div style={{ width: `${pB}%` }} className="h-full bg-orange-400" />
      <div style={{ width: `${pC}%` }} className="h-full bg-red-400 rounded-r-full" />
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1 min-w-0">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

// ─── Export xlsx ─────────────────────────────────────────────────────────────
function exportToXlsx(batches) {
  const rows = batches.map(b => ({
    'Batch ID': b.id,
    'Tanggal': b.date,
    'Jenis Ikan': b.jenis,
    'Grade A': b.gradeA,
    'Grade B': b.gradeB,
    'Grade C': b.gradeC,
    'Total': b.total,
    'Berat (kg)': b.berat,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Distribusi Grade')
  XLSX.writeFile(wb, `distribusi-grade-${CURRENT_MONTH}-${CURRENT_YEAR}.xlsx`)
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StatisticPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stats, batches, fetchDistribusi } = useDistribusi()

  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage] = useState(1)

  const jenisOptions = useMemo(() => [...new Set(batches.map(b => b.jenis))], [batches])

  const filtered = useMemo(() => {
    let result = batches
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b => b.id.toLowerCase().includes(q) || b.jenis.toLowerCase().includes(q))
    }
    if (filterJenis) result = result.filter(b => b.jenis === filterJenis)
    return result
  }, [batches, search, filterJenis])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1) }, [search, filterJenis])
  useEffect(() => {
    if (user && user.id) {
      fetchDistribusi(user.id);
    }
  }, [user, fetchDistribusi]);
  function handleBatchClick(batch) {
    if (batch.status === 'completed') {
      navigate(`/batches/${batch.id}/hasil`)
    } else {
      navigate(`/batches/${batch.id}/upload`)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribusi grade ikan</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Ringkasan grade per batch · {CURRENT_MONTH} {CURRENT_YEAR}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari batch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(v => !v)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal size={15} />
              Filter
              {filterJenis && <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />}
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-11 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Jenis ikan</p>
                  <button
                    onClick={() => { setFilterJenis(''); setShowFilter(false) }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!filterJenis ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-50'}`}
                  >
                    Semua
                  </button>
                  {jenisOptions.map(j => (
                    <button
                      key={j}
                      onClick={() => { setFilterJenis(j); setShowFilter(false) }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filterJenis === j ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-50'}`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export */}
          <button
            onClick={() => exportToXlsx(filtered)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#f58220] text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Upload size={15} />
            Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-4 mb-8">
        <StatCard label="Total Batch" value={stats.totalBatch} />
        <StatCard label="Total Ikan" value={stats.totalIkan.toLocaleString('id-ID')} />
        <StatCard label="Grade A" value={`${stats.gradeAPercent}%`} valueClass="text-green-600" />
        <StatCard label="Reject (C)" value={`${stats.rejectPercent}%`} valueClass="text-red-500" />
      </div>

      {/* ── Table ── */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Batch','Tanggal','Jenis','Grade A','Grade B','Grade C','Total','Distribusi','Berat'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Tidak ada batch ditemukan
                </td>
              </tr>
            ) : paginated.map((batch, idx) => (
              <tr
                key={batch.id}
                className={`border-b border-gray-100 hover:bg-orange-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleBatchClick(batch)}
                    className="text-[#f58220] font-bold hover:underline"
                  >
                    {batch.id}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{batch.date}</td>
                <td className="px-4 py-3 text-gray-800">{batch.jenis}</td>
                <td className="px-4 py-3 font-bold text-green-600">{batch.gradeA}</td>
                <td className="px-4 py-3 font-bold text-orange-500">{batch.gradeB}</td>
                <td className="px-4 py-3 font-bold text-red-500">{batch.gradeC}</td>
                <td className="px-4 py-3 text-gray-600">{batch.total}</td>
                <td className="px-4 py-3">
                  <DistribusiBar gradeA={batch.gradeA} gradeB={batch.gradeB} gradeC={batch.gradeC} total={batch.total} />
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{batch.berat} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-400">
          Menampilkan {Math.min(paginated.length, PER_PAGE)} dari {filtered.length} batch
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  p === page ? 'bg-[#f58220] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
