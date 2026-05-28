// src/components/ui/SlotUpload.jsx
import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

/**
 * @param {Object}   props
 * @param {'eye'|'gill'} props.role    - Identitas slot
 * @param {string}   props.label       - Label di atas slot, e.g. "Foto Mata Ikan"
 * @param {{file: File, preview: string, name: string} | null} props.file
 * @param {Function} props.onFiles     - Dipanggil dengan FileList saat file dipilih/drop
 * @param {Function} props.onRemove    - Dipanggil saat tombol hapus diklik
 */
export default function SlotUpload({ role, label, file, onFiles, onRemove }) {
  const inputRef  = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files)
  }

  const tagStyle = role === 'eye'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-emerald-50 text-emerald-700'

  return (
    <div className="flex flex-col gap-2">
      {/* Label tag */}
      <span className={`self-start text-md font-semibold px-3 py-1 rounded-full ${tagStyle}`}>
        {label}
      </span>

      {/* Zona drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current.click()}
        className={`
          relative border-2 border-dashed rounded-xl transition-all
          flex flex-col items-center justify-center min-h-[220px] p-6
          ${file
            ? 'border-[#FB7D00] bg-orange-50/40 cursor-default'
            : dragActive
              ? 'border-[#FB7D00] bg-[#FB7D00]/5 cursor-copy'
              : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400 cursor-pointer'
          }
        `}
      >
        {file ? (
          /* ── Preview state ── */
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative">
              <img
                src={file.preview}
                alt={`preview ${role}`}
                className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
              {/* Tombol hapus di pojok preview */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-700 max-w-[160px] truncate text-center">
              {file.name}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}
              className="text-xs text-[#FB7D00] font-semibold hover:underline"
            >
              Ganti foto
            </button>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
            <div className="bg-orange-100 p-3.5 rounded-full">
              <Upload className="w-7 h-7 text-[#FB7D00]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Tarik gambar ke sini</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP · maks 5 MB</p>
            </div>
            <div className="flex items-center gap-3 w-full max-w-[180px]">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">atau</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
            {/* pointer-events-auto agar button bisa diklik walau parent pointer-events-none */}
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}
              className="pointer-events-auto text-xs font-semibold px-5 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:shadow-md transition-all active:scale-95"
            >
              Pilih file dari komputer
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input — single file, tidak multiple */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files) }}
      />
    </div>
  )
}