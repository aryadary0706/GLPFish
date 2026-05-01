import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useInspections } from '@/hooks/useInspection'
import { Upload, X, LayoutGrid, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/services/api'

export default function DashboardPage() {
  const { user } = useAuth()
  const { inspections, loading, refresh } = useInspections()
  const [dragActive, setDragActive] = useState(false)
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const newFiles = Array.from(files)
      .filter(file => ALLOWED_TYPES.includes(file.type))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }))
    setFileList(prev => [...prev, ...newFiles])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (id) => {
    setFileList(prev => prev.filter(item => item.id !== id))
  }

  const handleUpload = async () => {
    if (fileList.length === 0) return

    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    fileList.forEach((item) => formData.append('files', item.file))

    try {
      const response = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { success_count, fail_count } = response.data

      if (fail_count > 0) {
        setUploadResult({ success: false, message: `${success_count} berhasil, ${fail_count} gagal diunggah.` })
      } else {
        setUploadResult({ success: true, message: `${success_count} file berhasil diunggah!` })
        setFileList([])
        refresh() // Muat ulang riwayat gambar
      }
    } catch (err) {
      console.error('Gagal upload:', err)
      setUploadResult({
        success: false,
        message: err.response?.data?.error || 'Gagal mengunggah file.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Halo, {user?.user_metadata?.name ?? user?.email}!</h1>
        <p className="text-slate-500 mt-1">Unggah foto-foto ikan untuk memulai prediksi</p>
      </div>

      {/* Upload Section - Web Style */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Input Data Inspeksi</h3>

          {/* Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center ${dragActive ? 'border-[#FB7D00] bg-[#FB7D00]/5' : 'border-slate-300 bg-slate-50 hover:bg-white'
              }`}
          >
            <div className="bg-orange-100 p-4 rounded-full mb-4">
              <Upload className="w-10 h-10 text-[#FB7D00]" />
            </div>
            <p className="text-xl font-medium text-slate-700 text-center">
              Tarik gambar ke sini
            </p>
            <p className="text-slate-400 mt-2 mb-8 text-center text-sm">
              Mendukung PNG, JPG, dan WEBP. Maks. 5 MB per file.
            </p>

            <div className="flex items-center gap-4 w-full max-w-sm">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-bold text-slate-400 uppercase">Atau</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button
              onClick={() => inputRef.current.click()}
              className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:shadow-md transition-all active:scale-95"
            >
              Pilih File dari Komputer
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple // Mengizinkan lebih dari 1 file
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* List Preview File - Muncul jika ada file yang dipilih */}
          {fileList.length > 0 && (
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <LayoutGrid size={16} /> File Terpilih ({fileList.length})
                </h4>
                <button
                  onClick={() => setFileList([])}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 size={14} /> Hapus Semua
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileList.map((item) => (
                  <div key={item.id} className="group relative bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4 transition-all hover:border-[#FB7D00]/40">
                    <div className="shrink-0">
                      <img src={item.preview} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="preview" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Image File</p>
                    </div>

                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6 space-y-3">
                {/* Feedback upload */}
                {uploadResult && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${uploadResult.success
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {uploadResult.success
                      ? <CheckCircle size={16} />
                      : <AlertCircle size={16} />}
                    {uploadResult.message}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-4 bg-[#FB7D00] text-white font-bold rounded-xl hover:bg-[#E26C00] shadow-lg shadow-orange-100 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengunggah...
                    </>
                  ) : 'Mulai Proses Analisis AI'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Inspection History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} /> Riwayat Gambar
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB7D00]"></div>
              <span className="ml-3 text-slate-500">Memuat riwayat...</span>
            </div>
          ) : inspections.length > 0 ? (
            <div className="space-y-3">
              {inspections.map((inspection) => (
                <HistoryRow key={inspection.id} {...inspection} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <p>Belum ada riwayat inspeksi. Unggah file untuk memulai analisis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryRow({ id, file_name, uploaded_at, prediction_results }) {
  const dateStr = uploaded_at
    ? new Date(uploaded_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    : 'N/A'

  // Supabase returns one-to-one relation as object, bukan array
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
        <p className="text-xs text-slate-500">{result?.label ?? 'Menunggu prediksi'}</p>
      </div>
    </div>
  )
}