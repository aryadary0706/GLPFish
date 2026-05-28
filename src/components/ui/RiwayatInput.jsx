export default function HistoryRow({ id, file_name, uploaded_at, prediction_results }) {
  const dateStr = uploaded_at
    ? new Date(uploaded_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    : 'N/A'

  const result = prediction_results ?? null

  return (
    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex-1">
        <p className="font-semibold text-slate-800">{file_name ?? '—'}</p>
        <p className="text-sm text-slate-500">{dateStr}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[#FB7D00]">
          {result?.confidence_score != null
            ? `${(result.confidence_score * 100).toFixed(1)}%`
            : 'N/A'}
        </p>
        <p className="text-xs text-slate-500">{result?.label_text ?? 'Menunggu prediksi'}</p>
      </div>
    </div>
  )
}