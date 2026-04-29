import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Upload, X, FileArchive, ImageIcon, LayoutGrid, Trash2 } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [fileList, setFileList] = useState([]) // State untuk menyimpan daftar banyak file
  const inputRef = useRef(null)

  // Fungsi untuk memproses file yang masuk (Gambar atau ZIP)
  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      type: file.type || (file.name.endsWith('.zip') ? 'application/zip' : 'unknown')
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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Halo, {user?.name}!</h1>
        <p className="text-slate-500 mt-1">Unggah foto-foto ikan atau file ZIP berisi dataset untuk memulai inspeksi.</p>
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
            className={`relative border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center ${
              dragActive ? 'border-[#FB7D00] bg-[#FB7D00]/5' : 'border-slate-300 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="bg-orange-100 p-4 rounded-full mb-4">
              <Upload className="w-10 h-10 text-[#FB7D00]" />
            </div>
            <p className="text-xl font-medium text-slate-700 text-center">
              Tarik gambar atau file ZIP ke sini
            </p>
            <p className="text-slate-400 mt-2 mb-8 text-center text-sm">
              Mendukung pengunggahan banyak file (JPG, PNG, atau ZIP)
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
              accept="image/*,.zip" // Mengizinkan gambar dan zip
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
                      {item.preview ? (
                        <img src={item.preview} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="preview" />
                      ) : (
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-[#FB7D00]">
                          <FileArchive size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {item.name.endsWith('.zip') ? 'Archive File' : 'Image File'}
                      </p>
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

              <div className="pt-6">
                <button className="w-full py-4 bg-[#FB7D00] text-white font-bold rounded-xl hover:bg-[#E26C00] shadow-lg shadow-orange-100 transition-all active:scale-[0.99]">
                  Mulai Proses Analisis AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}