import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronRight, Upload, X } from 'lucide-react';

interface UploadPageProps {
  onBack: () => void;
}

export const UploadPhotoPage = ({ onBack }: UploadPageProps) => {
  // State untuk menyimpan gambar
  const [eyeImg, setEyeImg] = useState<string | null>(null);
  const [gillImg, setGillImg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // State & Ref untuk Fitur Live Camera
  const [activeCamera, setActiveCamera] = useState<'eye' | 'gill' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Referensi untuk input file lokal
  const eyeInputRef = useRef<HTMLInputElement>(null);
  const gillInputRef = useRef<HTMLInputElement>(null);
  
  // Maksimal file 10MB (dalam Bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; 

  // ==========================================
  // LOGIKA UPLOAD FILE DARI KOMPUTER
  // ==========================================
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'eye' | 'gill') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`Gagal upload. Ukuran file "${file.name}" terlalu besar (Max 10 MB).`);
      event.target.value = '';
      return;
    }

    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'eye') setEyeImg(previewUrl);
    else setGillImg(previewUrl);
  };

  // ==========================================
  // LOGIKA LIVE CAMERA (WEBRTC)
  // ==========================================
  
  // Memasang stream ke elemen <video> saat kamera aktif
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, activeCamera]);

  // Membersihkan (mematikan) kamera jika user pindah halaman
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async (type: 'eye' | 'gill') => {
    setUploadError(null);
    try {
      // Meminta izin kamera ke browser (memprioritaskan kamera belakang jika di HP)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setActiveCamera(type);
    } catch (err) {
      console.error("Camera error:", err);
      setUploadError("Gagal mengakses kamera. Pastikan kamu telah memberikan izin kamera di browser ini.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setActiveCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && activeCamera) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Menggambar frame saat ini dari video ke dalam canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        // Mengubah gambar canvas menjadi URL Data Base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        if (activeCamera === 'eye') setEyeImg(dataUrl);
        else setGillImg(dataUrl);
        
        stopCamera();
      }
    }
  };

  const isReadyToProcess = eyeImg !== null || gillImg !== null;

  return (
    <div className="flex-1 bg-white min-h-screen p-8 max-w-6xl mx-auto flex flex-col relative">
      
      {/* ── MODAL LIVE CAMERA ── */}
      {activeCamera && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4 lg:p-10 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-4 w-full max-w-4xl shadow-2xl flex flex-col gap-4">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-lg text-gray-900">
                Ambil Foto {activeCamera === 'eye' ? 'Mata' : 'Insang'} Ikan
              </h3>
              <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Area Video */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center w-full shadow-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-contain" 
              />
              {/* Overlay panduan bidik (Opsional) */}
              <div className="absolute inset-0 pointer-events-none border-[3px] border-orange-500/30 m-8 rounded-xl border-dashed"></div>
            </div>

            {/* Tombol Jepret */}
            <div className="flex justify-center pb-2">
              <button 
                onClick={capturePhoto} 
                className="bg-orange-500 text-white p-5 rounded-full hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
              >
                <Camera size={32} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── END MODAL ── */}


      {/* ── Hidden File Inputs untuk Upload dari Komputer ── */}
      <input 
        type="file" 
        accept=".jpg,.jpeg,.png,.heic" 
        className="hidden" 
        ref={eyeInputRef} 
        onChange={(e) => handleFileUpload(e, 'eye')} 
      />
      <input 
        type="file" 
        accept=".jpg,.jpeg,.png,.heic" 
        className="hidden" 
        ref={gillInputRef} 
        onChange={(e) => handleFileUpload(e, 'gill')} 
      />


      {/* ── HEADER HALAMAN UPLOAD ── */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span className="hover:text-gray-800 cursor-pointer" onClick={onBack}>Batches</span>
        <ChevronRight size={14} className="mx-1" />
        <span className="hover:text-gray-800 cursor-pointer" onClick={onBack}>B-2406-015</span>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-gray-900 font-medium">Upload</span>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Upload gambar ikan</h1>
          <p className="text-sm text-gray-500">Batch B-2406-015 • Kakap merah • target 120 ekor</p>
        </div>
        <div className="bg-orange-100 text-orange-600 font-bold text-sm px-4 py-1.5 rounded-full">
          8 / 120 ikan
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-center justify-between">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-700">Tutup</button>
        </div>
      )}

      {/* ── GRID GAMBAR (MATA & INSANG) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* KOTAK 1: MATA IKAN */}
        {eyeImg === null ? (
          <div className="border-2 border-dashed border-orange-400 bg-[#fff8f3] rounded-3xl p-6 lg:p-8 flex flex-col xl:flex-row items-center gap-6 justify-center text-center xl:text-left h-full min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Upload className="text-orange-500" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto mata<br/>ikan di sini</h3>
              <p className="text-orange-500/80 text-[11px] mt-2 leading-relaxed max-w-[200px] mx-auto xl:mx-0">
                JPG, PNG, HEIC • max 10 MB / file • CNN akan memproses otomatis setelah upload
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button 
                onClick={() => eyeInputRef.current?.click()} 
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Upload size={16} /> Pilih file
              </button>
              <button 
                onClick={() => startCamera('eye')}
                className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Camera size={16} /> Kamera
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-orange-400 bg-[#fff8f3] rounded-3xl p-6 flex flex-col h-full min-h-[400px]">
            <h3 className="text-orange-600 font-bold text-xl mb-4">Mata Ikan</h3>
            <div className="flex-1 w-full bg-gray-200 rounded-xl overflow-hidden mb-6 relative">
              <img src={eyeImg} alt="Preview Mata Ikan" className="w-full h-full object-contain absolute inset-0 bg-black/5" />
            </div>
            <div className="flex justify-center gap-4 shrink-0">
              <button 
                onClick={() => eyeInputRef.current?.click()} 
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Upload size={16} /> Ganti file
              </button>
              <button 
                onClick={() => startCamera('eye')}
                className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Camera size={16} /> Tangkap ulang
              </button>
            </div>
          </div>
        )}

        {/* KOTAK 2: INSANG IKAN */}
        {gillImg === null ? (
          <div className="border-2 border-dashed border-orange-400 bg-[#fff8f3] rounded-3xl p-6 lg:p-8 flex flex-col xl:flex-row items-center gap-6 justify-center text-center xl:text-left h-full min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Upload className="text-orange-500" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto insang<br/>ikan di sini</h3>
              <p className="text-orange-500/80 text-[11px] mt-2 leading-relaxed max-w-[200px] mx-auto xl:mx-0">
                JPG, PNG, HEIC • max 10 MB / file • CNN akan memproses otomatis setelah upload
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button 
                onClick={() => gillInputRef.current?.click()} 
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Upload size={16} /> Pilih file
              </button>
              <button 
                onClick={() => startCamera('gill')}
                className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Camera size={16} /> Kamera
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-orange-400 bg-[#fff8f3] rounded-3xl p-6 flex flex-col h-full min-h-[400px]">
            <h3 className="text-orange-600 font-bold text-xl mb-4">Insang Ikan</h3>
            <div className="flex-1 w-full bg-gray-200 rounded-xl overflow-hidden mb-6 relative">
              <img src={gillImg} alt="Preview Insang Ikan" className="w-full h-full object-contain absolute inset-0 bg-black/5" />
            </div>
            <div className="flex justify-center gap-4 shrink-0">
              <button 
                onClick={() => gillInputRef.current?.click()} 
                className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Upload size={16} /> Ganti file
              </button>
              <button 
                onClick={() => startCamera('gill')}
                className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Camera size={16} /> Tangkap ulang
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500">4 done • 1 uploading • 3 queued</p>
        <button 
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors ${isReadyToProcess ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!isReadyToProcess}
        >
          Lanjut ke proses CNN
        </button>
      </div>
    </div>
  );
};
