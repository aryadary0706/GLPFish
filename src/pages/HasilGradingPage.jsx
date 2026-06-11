import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, X, Check } from 'lucide-react'
import { useHasilGrading } from '@/hooks/useHasilGrading'

const GRADE_CFG = {
  A: { label: 'Grade A', badgeBg: 'bg-green-100', badgeText: 'text-green-700', numColor: 'text-green-400', blob: 'bg-green-400/25', sub: 'premium' },
  B: { label: 'Grade B', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700', numColor: 'text-yellow-400', blob: 'bg-yellow-400/25', sub: 'standar' },
  C: { label: 'Grade C', badgeBg: 'bg-red-100', badgeText: 'text-red-500', numColor: 'text-red-400', blob: 'bg-red-400/25', sub: 'reject' },
}

function FishCard({ name, grade, confidence }) {
  const cfg = GRADE_CFG[grade] || GRADE_CFG['C']
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col min-h-[160px] shadow-lg border border-gray-100">
      <div className="flex justify-between items-start mb-auto">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
          {cfg.label}
        </span>
        <span className="text-xs font-bold bg-gray-800 text-white px-2.5 py-1 rounded-full">
          {confidence}%
        </span>
      </div>
      <p className="text-center text-sm text-gray-400 mt-6">{name}</p>
    </div>
  )
}

function GradeStatCard({ grade, count, pct, total, berat }) {
  if (grade === 'total') {
    return (
      <div className="relative bg-[#1e2330] rounded-2xl p-5 overflow-hidden flex-1 border border-white/5">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gray-500/20" />
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Berat</p>
        <p className="text-3xl font-bold text-white">{berat} <span className="text-lg font-semibold text-gray-400">kg</span></p>
        <p className="text-sm text-gray-500 mt-1">{total} ekor</p>
      </div>
    )
  }
  const cfg = GRADE_CFG[grade] || GRADE_CFG['C']
  return (
    <div className="relative bg-[#1e2330] rounded-2xl p-5 overflow-hidden flex-1 border border-white/5">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${cfg.blob}`} />
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Grade {grade}</p>
      <p className={`text-3xl font-bold ${cfg.numColor}`}>{count || 0}</p>
      <p className="text-sm text-gray-500 mt-1">{pct || 0}% · {cfg.sub}</p>
    </div>
  )
}

export default function HasilGradingPage() {
  const { batchId } = useParams()
  const navigate = useNavigate()
  const { fetchGrading, saveGrading, rejectGrading, grading, loading, error } = useHasilGrading()

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    if (batchId) fetchGrading(batchId)
  }, [batchId, fetchGrading])

  async function handleSave() {
    setActionLoading(true)
    setActionMsg('')
    try {
      await saveGrading(batchId)
      setActionMsg('Hasil grading berhasil disimpan')
      setTimeout(() => navigate('/statistic'), 1500)
    } catch (err) {
      setActionMsg(err.message || 'Gagal menyimpan — coba lagi')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    setActionLoading(true)
    setActionMsg('')
    try {
      await rejectGrading(batchId)
      setActionMsg('Grading ditolak')
      setTimeout(() => navigate('/batches/create'), 1500)
    } catch (err) {
      setActionMsg(err.message || 'Gagal menolak — coba lagi')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat hasil grading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!grading) return null

  // Mencegah error pembagian dengan 0
  const total = grading.totalIkan || 1
  const pctA = Math.round(((grading.gradeA || 0) / total) * 100)
  const pctB = Math.round(((grading.gradeB || 0) / total) * 100)
  const pctC = Math.round(((grading.gradeC || 0) / total) * 100)

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <button onClick={() => navigate('/batches/create')} className="hover:text-gray-800 transition-colors">Batches</button>
          <ChevronRight size={14} className="mx-1" />
          <button onClick={() => navigate('/batches/create')} className="hover:text-gray-800 transition-colors">{batchId}</button>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-gray-400">Hasil grading</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hasil grading</h1>
            <p className="text-sm text-gray-500 mt-1">
              {grading.totalIkan} ikan dianalisis · {grading.avgConfidence}% rata-rata konfidensi · {grading.duration || '00:00'} menit
            </p>
          </div>

          <div className="flex items-center gap-3">
            {actionMsg && (
              <span className={`text-sm px-4 py-2 rounded-xl font-medium ${actionMsg.includes('berhasil') || actionMsg.includes('ditolak')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
                }`}>
                {actionMsg}
              </span>
            )}
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X size={15} /> Tolak
            </button>
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#f58220] text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <Check size={15} /> Simpan hasil grading
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="px-8 pb-6 flex gap-4">
        <GradeStatCard grade="A" count={grading.gradeA} pct={pctA} />
        <GradeStatCard grade="B" count={grading.gradeB} pct={pctB} />
        <GradeStatCard grade="C" count={grading.gradeC} pct={pctC} />
        <GradeStatCard grade="total" total={grading.totalIkan} berat={grading.totalBerat} />
      </div>

      {/* ── Fish grid ── */}
      <div className="flex-1 px-8 pb-8 bg-gray-50 rounded-tl-3xl pt-8">
        {grading.fish && grading.fish.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {grading.fish.map((f, idx) => (
              <FishCard key={f.id || idx} name={f.name} grade={f.grade} confidence={f.confidence} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-10">Belum ada ikan yang diproses di batch ini.</div>
        )}
      </div>
    </div>
  )
}