import { useEffect, useState } from 'react'
import { Ban, X, AlertTriangle, Loader2 } from 'lucide-react'

export default function RejectBatchModal({ open, batch, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setError(null)
      setReason('')
      setSubmitting(false)
    }
  }, [open, batch?.id])

  if (!open || !batch) return null

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      setError(null)
      await onConfirm(batch, reason.trim())
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Gagal menolak batch.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">Tolak Batch?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Tindakan ini akan menandai batch sebagai{' '}
              <span className="font-semibold text-red-600">Rejected</span> dan menambahnya ke
              perhitungan statistik reject. Aksi ini tidak dapat dibatalkan oleh staff.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-6 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Batch ID</span>
            <span className="text-sm font-bold text-gray-900">{batch.id}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Jenis</span>
            <span className="text-sm text-gray-800">{batch.fishCategory || batch.jenis || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Oleh</span>
            <span className="text-sm text-gray-800">{batch.userName || '-'}</span>
          </div>
        </div>

        <div className="px-6 pb-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
            Alasan (opsional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="Misal: kualitas foto tidak layak, ikan rusak, dll."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 resize-none disabled:bg-gray-50"
          />
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-lg">
            {error}
          </div>
        )}

        <div className="px-6 pb-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl flex items-center gap-2 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
            {submitting ? 'Memproses...' : 'Tolak Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}
