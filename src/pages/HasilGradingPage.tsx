import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, X, Check } from 'lucide-react'
import { useHasilGrading } from '../hooks/useHasilGrading'

// ── TIPE DATA / INTERFACES ──
type GradeConfig = {
  label: string;
  badgeBg: string;
  badgeText: string;
  numColor: string;
  blob: string;
  sub: string;
}

interface FishData {
  id: string;
  fish_index: number;
  status: string;
  eye_image_url: string;
  gill_image_url: string;
  prediction_results: {
    grade: string;
    confidence: number;
  } | null;
}

interface GradeStatCardProps {
  grade: 'A' | 'B' | 'C' | 'total' | string;
  count?: number;
  pct?: number;
  total?: number;
  berat?: number;
}

// ── KONFIGURASI GRADE ──
const GRADE_CFG: Record<string, GradeConfig> = {
  A: { label: 'Grade A', badgeBg: 'bg-green-100', badgeText: 'text-green-700', numColor: 'text-green-400', blob: 'bg-green-400/25', sub: 'premium' },
  B: { label: 'Grade B', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700', numColor: 'text-yellow-400', blob: 'bg-yellow-400/25', sub: 'standar' },
  C: { label: 'Grade C', badgeBg: 'bg-red-100', badgeText: 'text-red-500', numColor: 'text-red-400', blob: 'bg-red-400/25', sub: 'reject' },
  PENDING: { label: 'Pending', badgeBg: 'bg-gray-100', badgeText: 'text-gray-500', numColor: 'text-gray-400', blob: 'bg-gray-400/25', sub: 'menunggu' },
}

// ── KOMPONEN KARTU IKAN ──
function FishCard({ fish }: { fish: FishData }) {
  const pred = Array.isArray(fish.prediction_results) 
    ? fish.prediction_results[0] 
    : fish.prediction_results || null;

  // 💥 PERUBAHAN: Hapus `fish.status === 'pending'`. 
  // Kita murni cuma ngecek apakah hasil AI (pred) sudah ada atau belum.
  const isPending = !pred || !pred.grade;
  
  const grade = isPending ? 'PENDING' : (pred.grade || 'C').toUpperCase();
  const confidence = isPending ? 0 : (pred.confidence ?? pred.confidence_score ?? 0);
  
  const cfg = GRADE_CFG[grade] || GRADE_CFG['C'];
  
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
          {cfg.label}
        </span>
        <span className="text-xs font-bold bg-gray-800 text-white px-2.5 py-1 rounded-full">
          {confidence}%
        </span>
      </div>

      {/* Grid untuk 2 gambar: Mata dan Insang */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col gap-1.5">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
            <img 
              src={fish.eye_image_url} 
              alt={`Mata Ikan ${fish.fish_index}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-[10px] text-gray-500 text-center font-semibold uppercase tracking-wider">Mata</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
            <img 
              src={fish.gill_image_url} 
              alt={`Insang Ikan ${fish.fish_index}`} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-[10px] text-gray-500 text-center font-semibold uppercase tracking-wider">Insang</span>
        </div>
      </div>

      <p className="text-center text-sm font-bold text-gray-800 mt-auto">
        Ikan #{fish.fish_index}
      </p>
    </div>
  )
}

// ── KOMPONEN KARTU STATISTIK ──
function GradeStatCard({ grade, count, pct, total, berat }: GradeStatCardProps) {
  if (grade === 'total') {
    return (
      <div className="relative bg-[#1e2330] rounded-2xl p-5 overflow-hidden flex-1 border border-white/5">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gray-500/20" />
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Berat</p>
        <p className="text-3xl font-bold text-white">{berat || 0} <span className="text-lg font-semibold text-gray-400">kg</span></p>
        <p className="text-sm text-gray-500 mt-1">{total || 0} ekor</p>
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

// ── HALAMAN UTAMA ──
export default function HasilGradingPage() {
  const { batchId } = useParams<{ batchId: string }>()
  const navigate = useNavigate()
  
  // Mengambil state dan fungsi dari hook yang sudah terhubung dengan api interceptor
  const { 
    fetchGrading, 
    fetchFishes, 
    saveGrading, 
    rejectGrading, 
    grading, 
    fishes, 
    loading, 
    loadingFishes, 
    error 
  } = useHasilGrading() as any;

  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    if (batchId) {
      fetchGrading(batchId)
      fetchFishes(batchId)
    }
  }, [batchId, fetchGrading, fetchFishes])

  async function handleSave() {
    if (!batchId) return;
    setActionLoading(true)
    setActionMsg('')
    try {
      await saveGrading(batchId)
      setActionMsg('Hasil grading berhasil disimpan')
      setTimeout(() => navigate('/statistic'), 1500)
    } catch (err: any) {
      setActionMsg(err.message || 'Gagal menyimpan — coba lagi')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!batchId) return;
    setActionLoading(true)
    setActionMsg('')
    try {
      await rejectGrading(batchId)
      setActionMsg('Grading ditolak')
      setTimeout(() => navigate('/batches/create'), 1500)
    } catch (err: any) {
      setActionMsg(err.message || 'Gagal menolak — coba lagi')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || loadingFishes) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Memuat hasil grading dan foto ikan...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center flex-col gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button 
          onClick={() => navigate('/batches/create')}
          className="text-white bg-gray-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
        >
          Kembali ke Batches
        </button>
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
              {grading.totalIkan || 0} ikan dianalisis · {grading.avgConfidence || 0}% rata-rata konfidensi · {grading.duration || '00:00'} menit
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
        {fishes && fishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fishes.map((fish: FishData) => (
              <FishCard key={fish.id} fish={fish} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-10">Belum ada ikan yang diproses di batch ini.</div>
        )}
      </div>
    </div>
  )
}