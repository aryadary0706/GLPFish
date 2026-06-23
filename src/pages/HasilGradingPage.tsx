import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, X, Check, RefreshCw, Ban, BrainCircuit, Info } from 'lucide-react'
import { useHasilGrading } from '../hooks/useHasilGrading'
import RejectBatchModal from '../components/ui/RejectBatchModal'
import { AuthContext } from '../context/AuthContext'

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
  estimasi?: number;
}

// ── KONFIGURASI GRADE ──
const GRADE_CFG: Record<string, GradeConfig> = {
  A: { label: 'Grade A', badgeBg: 'bg-green-100', badgeText: 'text-green-700', numColor: 'text-green-400', blob: 'bg-green-400/25', sub: 'premium' },
  B: { label: 'Grade B', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700', numColor: 'text-yellow-400', blob: 'bg-yellow-400/25', sub: 'standar' },
  C: { label: 'Grade C', badgeBg: 'bg-red-100', badgeText: 'text-red-500', numColor: 'text-red-400', blob: 'bg-red-400/25', sub: 'reject' },
  PENDING: { label: 'Pending', badgeBg: 'bg-gray-100', badgeText: 'text-gray-500', numColor: 'text-gray-400', blob: 'bg-gray-400/25', sub: 'menunggu' },
}

// ── KOMPONEN KARTU IKAN ──
function FishCard({ fish, onRetake, retakeDisabled, showRetake = true }: { fish: FishData; onRetake: (fish: FishData) => void; retakeDisabled?: boolean; showRetake?: boolean }) {
  const pred = Array.isArray(fish.prediction_results)
    ? fish.prediction_results[0]
    : fish.prediction_results || null;

  // 💥 PERUBAHAN: Hapus `fish.status === 'pending'`.
  // Kita murni cuma ngecek apakah hasil AI (pred) sudah ada atau belum.
  const isPending = !pred || !pred.grade;

  const grade = isPending ? 'PENDING' : (pred.grade || 'C').toUpperCase();
  // Raw model confidence — keyakinan model terhadap KELAS yang dipilih.
  const confidence = isPending ? 0 : (pred.confidence ?? (pred as any).confidence_score ?? 0);

  const cfg = GRADE_CFG[grade] || GRADE_CFG['C'];

  return (
    <div className="bg-white rounded-xl p-4 flex flex-col shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
          {cfg.label}
        </span>
        <span
          className="text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 pl-1.5 pr-2.5 py-1 rounded-full inline-flex items-center gap-1"
          title="Keyakinan model terhadap klasifikasi (akurasi prediksi), BUKAN tingkat kesegaran ikan. Untuk Grade C, % tinggi = model yakin ikan tidak segar."
        >
          <BrainCircuit size={11} />
          Akurasi {confidence}%
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

      {showRetake && (
        <button
          onClick={() => onRetake(fish)}
          disabled={retakeDisabled}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold border border-orange-300 text-orange-600 rounded-lg py-2 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={13} /> Retake
        </button>
      )}
    </div>
  )
}

// ── KOMPONEN KARTU STATISTIK ──
const STAT_CARD_THEME: Record<string, { bg: string; border: string; blob: string; numText: string; labelText: string; subText: string }> = {
  A:     { bg: 'bg-green-50',  border: 'border-green-200',  blob: 'bg-green-300/40',  numText: 'text-green-700',  labelText: 'text-green-700',  subText: 'text-green-600' },
  B:     { bg: 'bg-yellow-50', border: 'border-yellow-200', blob: 'bg-yellow-300/40', numText: 'text-yellow-700', labelText: 'text-yellow-700', subText: 'text-yellow-600' },
  C:     { bg: 'bg-red-50',    border: 'border-red-200',    blob: 'bg-red-300/40',    numText: 'text-red-700',    labelText: 'text-red-700',    subText: 'text-red-500' },
  total: { bg: 'bg-orange-50', border: 'border-orange-200', blob: 'bg-orange-300/40', numText: 'text-orange-700', labelText: 'text-orange-700', subText: 'text-orange-600' },
}

function GradeStatCard({ grade, count, pct, total, berat, estimasi }: GradeStatCardProps) {
  if (grade === 'total') {
    const t = STAT_CARD_THEME.total
    const targeted = estimasi || 0
    const analyzed = total || 0
    const isPartial = targeted > 0 && analyzed < targeted
    return (
      <div className={`relative ${t.bg} rounded-2xl p-5 overflow-hidden flex-1 border ${t.border} shadow-sm`}>
        <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${t.blob}`} />
        <p className={`text-[11px] font-bold ${t.labelText} uppercase tracking-widest mb-2`}>Total Berat</p>
        <p className={`text-3xl font-bold ${t.numText}`}>{berat || 0} <span className="text-lg font-semibold text-gray-500">kg</span></p>
        <p className={`text-sm ${t.subText} mt-1`}>
          {analyzed} / {targeted || analyzed} ekor dianalisis
        </p>
        {isPartial && (
          <p className="text-[10px] text-orange-700 font-semibold mt-0.5">
            {targeted - analyzed} ekor belum dianalisis
          </p>
        )}
      </div>
    )
  }
  const cfg = GRADE_CFG[grade] || GRADE_CFG['C']
  const t = STAT_CARD_THEME[grade] || STAT_CARD_THEME.C
  return (
    <div className={`relative ${t.bg} rounded-2xl p-5 overflow-hidden flex-1 border ${t.border} shadow-sm`}>
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${t.blob}`} />
      <p className={`text-[11px] font-bold ${t.labelText} uppercase tracking-widest mb-2`}>Grade {grade}</p>
      <p className={`text-3xl font-bold ${t.numText}`}>{count || 0}</p>
      <p className={`text-sm ${t.subText} mt-1`}>{pct || 0}% · {cfg.sub}</p>
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const authCtx = useContext(AuthContext) as any
  const user = authCtx?.user
  const isAdmin = user?.role === 'admin'
    || user?.email === 'admin@glpfish.com'
    || user?.email === 'admin123@gmail.com'

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

  async function handleReject(_batch: any, reason?: string) {
    if (!batchId) return;
    setActionLoading(true)
    setActionMsg('')
    try {
      await rejectGrading(batchId, reason)
      setActionMsg('Grading ditolak')
      setTimeout(() => navigate('/batches/create'), 1500)
    } catch (err: any) {
      setActionMsg(err.message || 'Gagal menolak — coba lagi')
      throw err
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

  // Batch dianggap "selesai" hanya jika semua ikan punya prediksi.
  // Saat batch belum selesai (preview dari Upload page), tombol Simpan/Tolak disembunyikan.
  const hasFish = Array.isArray(fishes) && fishes.length > 0
  const allFishPredicted = hasFish && fishes.every((f: FishData) => {
    const pred = Array.isArray(f.prediction_results)
      ? f.prediction_results[0]
      : f.prediction_results
    return pred && (pred as any).grade
  })
  // Status final = batch sudah dikonfirmasi (saved/completed) atau ditolak (rejected).
  const finalStatus = (grading as any).preprocessedStatus
  const isFinalized = finalStatus === 'saved' || finalStatus === 'rejected'
  // Tombol Simpan/Tolak hanya muncul saat semua ikan terprediksi DAN batch belum final.
  const isBatchComplete = allFishPredicted && !isFinalized

  const isRejected = finalStatus === 'rejected'

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* ── Banner Reject (paling atas, prominent) ── */}
      {isRejected && (
        <div className="mx-8 mt-8 mb-2 rounded-2xl border-2 border-red-200 bg-red-50 p-5 flex items-start gap-4 shadow-sm">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Ban size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-700 mb-1">Batch ini ditolak</h2>
            <p className="text-sm text-red-700/90 leading-relaxed">
              Hasil grading batch <span className="font-mono font-semibold">{batchId}</span> telah ditolak dan tidak diteruskan untuk ekspor.
              Data tetap tersimpan untuk arsip, namun tidak dihitung dalam statistik kelayakan.
            </p>
            {(grading as any).rejectReason ? (
              <div className="mt-3 rounded-xl bg-white border border-red-200 px-4 py-3">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">Alasan dari admin</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{(grading as any).rejectReason}</p>
              </div>
            ) : (
              <p className="text-xs text-red-600/70 mt-3 italic">Admin tidak menyertakan alasan spesifik untuk penolakan ini.</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-red-600/80">
              <span><span className="font-semibold">Status:</span> Rejected</span>
              <span><span className="font-semibold">Jenis ikan:</span> {grading.jenis || '-'}</span>
              <span><span className="font-semibold">Total ikan:</span> {grading.totalIkan || 0}</span>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-2xl font-bold text-gray-900">
              {!allFishPredicted ? 'Hasil sementara' : 'Hasil grading'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 inline-flex items-center gap-1 flex-wrap">
              {grading.totalIkan || 0}
              {(grading as any).estimasi ? ` dari ${(grading as any).estimasi}` : ''} ikan dianalisis · {grading.avgConfidence || 0}% rata-rata akurasi model
              <span
                title="% = seberapa yakin model terhadap klasifikasi mata & insang. Bukan tingkat kesegaran ikan."
                className="text-gray-400 cursor-help inline-flex"
              >
                <Info size={13} />
              </span>
              · {grading.duration || '00:00'} menit
            </p>
            {!allFishPredicted && (
              <p className="text-xs text-orange-600 mt-1 font-semibold">
                Batch belum selesai — Anda dapat melakukan retake sebelum prediksi final.
              </p>
            )}
            {isFinalized && !isRejected && (
              <p className="text-xs mt-1 font-semibold text-green-600">
                Batch ini telah disimpan sebagai final.
              </p>
            )}
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
            {isBatchComplete && (
              <>
                {isAdmin && (
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <X size={15} /> Tolak
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#f58220] text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <Check size={15} /> Simpan hasil grading
                </button>
              </>
            )}
            {!allFishPredicted && !isFinalized && (
              <button
                onClick={() => navigate(`/batches/${batchId}/upload`)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#f58220] text-white rounded-xl hover:bg-orange-600 transition-colors"
              >
                Lanjutkan upload
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="px-8 pb-6 flex gap-4">
        <GradeStatCard grade="A" count={grading.gradeA} pct={pctA} />
        <GradeStatCard grade="B" count={grading.gradeB} pct={pctB} />
        <GradeStatCard grade="C" count={grading.gradeC} pct={pctC} />
        <GradeStatCard grade="total" total={grading.totalIkan} berat={grading.totalBerat} estimasi={(grading as any).estimasi} />
      </div>

      {/* ── Fish grid ── */}
      <div className="flex-1 px-8 pb-8 bg-gray-50 rounded-tl-3xl pt-8">
        {fishes && fishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fishes.map((fish: FishData) => (
              <FishCard
                key={fish.id}
                fish={fish}
                retakeDisabled={actionLoading || isFinalized}
                showRetake={!isFinalized}
                onRetake={(f) =>
                  navigate(
                    `/batches/${batchId}/upload?retake=${f.id}&index=${f.fish_index}`
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-10">Belum ada ikan yang diproses di batch ini.</div>
        )}
      </div>

      <RejectBatchModal
        open={rejectModalOpen}
        batch={rejectModalOpen ? { id: batchId, jenis: grading.jenis } : null}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  )
}