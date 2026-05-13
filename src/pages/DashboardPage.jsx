// src/pages/DashboardPage.jsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useInspections } from '@/hooks/useInspection'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import HistoryRow from '../components/ui/RiwayatInput'
import SlotUpload from '../components/ui/uploadForm'

export default function DashboardPage() {
  const { user } = useAuth()
  const { inspections, loading, refresh } = useInspections()

  const [eyeFile,      setEyeFile]      = useState(null)   // { file, preview, name }
  const [gillFile,     setGillFile]     = useState(null)   // { file, preview, name }
  const [uploading,    setUploading]    = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  // Terima FileList dari SlotUpload, validasi tipe, simpan ke state
  const handleFiles = (files, role) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    const file = Array.from(files).find(f => ALLOWED.includes(f.type))
    if (!file) return

    const payload = {
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }

    if (role === 'eye')  setEyeFile(payload)
    if (role === 'gill') setGillFile(payload)

    // Reset result lama saat user pilih file baru
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!eyeFile || !gillFile) return

    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('eye',  eyeFile.file)
    formData.append('gill', gillFile.file)

    try {
      const response = await api.post('/upload/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const { prediction } = response.data

      setUploadResult({
        success: true,
        message: `Analisis selesai! Grade ikan: ${prediction.grade} — ${prediction.label}`,
        prediction,
      })

      // Reset slot setelah berhasil
      setEyeFile(null)
      setGillFile(null)
      refresh()

    } catch (err) {
      setUploadResult({
        success: false,
        message: err.response?.data?.error || 'Gagal menganalisis foto.',
      })
    } finally {
      setUploading(false)
    }
  }

  const bothSelected = !!eyeFile && !!gillFile

  return (
    <div className="space-y-8">

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Halo, {user?.name}!
        </h1>
        <p className="text-slate-500 mt-1">Unggah foto mata dan insang ikan untuk uji kesegaran</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Input Data Inspeksi</h3>

          {/* Dua slot bersebelahan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlotUpload
              role="eye"
              label="Foto Mata Ikan"
              file={eyeFile}
              onFiles={(files) => handleFiles(files, 'eye')}
              onRemove={() => { setEyeFile(null); setUploadResult(null) }}
            />
            <SlotUpload
              role="gill"
              label="Foto Insang Ikan"
              file={gillFile}
              onFiles={(files) => handleFiles(files, 'gill')}
              onRemove={() => { setGillFile(null); setUploadResult(null) }}
            />
          </div>

          {/* Feedback + Tombol Analisis */}
          <div className="mt-6 space-y-3">

            {/* Feedback hasil upload */}
            {uploadResult && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                uploadResult.success
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {uploadResult.success
                  ? <CheckCircle size={16} className="shrink-0" />
                  : <AlertCircle size={16} className="shrink-0" />}
                {uploadResult.message}
              </div>
            )}

            {/* Tombol — disabled kalau belum pilih kedua foto */}
            <button
              onClick={handleUpload}
              disabled={uploading || !bothSelected}
              className="w-full py-4 bg-[#FB7D00] text-white font-bold rounded-xl hover:bg-[#E26C00] shadow-lg shadow-orange-100 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menganalisis...
                </>
              ) : !bothSelected ? (
                'Pilih kedua foto untuk mulai '
              ) : (
                'Mulai Proses Analisis AI'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Inspection History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} /> Riwayat Inspeksi
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB7D00]" />
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