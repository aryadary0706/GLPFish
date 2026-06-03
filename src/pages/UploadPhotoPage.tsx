import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronRight, Upload, X, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUploadPredict } from '@/hooks/useInspection';
import CNNLoadingOverlay from '@/components/ui/CNNLoadingOverlay';

interface UploadPageProps {
  onBack: () => void;
}

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export const UploadPhotoPage = ({ onBack }: UploadPageProps) => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  // Preview URLs
  const [eyeImg, setEyeImg] = useState<string | null>(null);
  const [gillImg, setGillImg] = useState<string | null>(null);
  // Actual File objects for API upload
  const [eyeFile, setEyeFile] = useState<File | null>(null);
  const [gillFile, setGillFile] = useState<File | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // Prediction result — shape: { grade, label, layak_ekspor, mata.confidence, insang.confidence }
  const [predictionResult, setPredictionResult] = useState<{
    grade: string;
    label: string;
    layak_ekspor: boolean;
    avgConfidence: number;
  } | null>(null);

  // Live camera
  const [activeCamera, setActiveCamera] = useState<'eye' | 'gill' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const eyeInputRef = useRef<HTMLInputElement>(null);
  const gillInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const { uploadAndPredict, loading, error: predictError, prediction } = useUploadPredict();

  // ==========================================
  // UPLOAD FILE DARI KOMPUTER
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

    if (type === 'eye') {
      setEyeImg(previewUrl);
      setEyeFile(file);
    } else {
      setGillImg(previewUrl);
      setGillFile(file);
    }
  };

  // ==========================================
  // LIVE CAMERA (WEBRTC)
  // ==========================================
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, activeCamera]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const startCamera = async (type: 'eye' | 'gill') => {
    setUploadError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setActiveCamera(type);
    } catch (err) {
      console.error('Camera error:', err);
      setUploadError('Gagal mengakses kamera. Pastikan kamu telah memberikan izin kamera di browser ini.');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
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
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const file = dataURLtoFile(dataUrl, `${activeCamera}-${Date.now()}.jpg`);

        if (activeCamera === 'eye') {
          setEyeImg(dataUrl);
          setEyeFile(file);
        } else {
          setGillImg(dataUrl);
          setGillFile(file);
        }

        stopCamera();
      }
    }
  };

  // ==========================================
  // CNN PREDICT
  // ==========================================
  const handleStartCNN = async () => {
    if (!eyeFile || !gillFile) return;
    setUploadError(null);
    setPredictionResult(null);

    try {
      // batchId dari URL params dikirim ke backend agar bisa mengelompokkan ikan per batch
      const result = await uploadAndPredict(eyeFile, gillFile, batchId);
      const pred = result?.prediction;
      if (pred) {
        const avgConf = ((pred.mata?.confidence ?? 0) + (pred.insang?.confidence ?? 0)) / 2;
        setPredictionResult({
          grade:         pred.grade,
          label:         pred.label,
          layak_ekspor:  pred.layak_ekspor,
          avgConfidence: Math.round(avgConf * 10) / 10,
        });
      }
    } catch {
      // error sudah tersimpan di predictError dari hook
    }
  };

  const isReadyToProcess = eyeImg !== null && gillImg !== null;

  return (
    <div className="flex-1 bg-white min-h-screen p-8 max-w-6xl mx-auto flex flex-col relative">

      {/* CNN Loading Overlay */}
      <CNNLoadingOverlay visible={loading} />

      {/* MODAL LIVE CAMERA */}
      {activeCamera && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4 lg:p-10 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-4 w-full max-w-4xl shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-lg text-gray-900">
                Ambil Foto {activeCamera === 'eye' ? 'Mata' : 'Insang'} Ikan
              </h3>
              <button onClick={stopCamera} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center w-full shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              <div className="absolute inset-0 pointer-events-none border-[3px] border-orange-500/30 m-8 rounded-xl border-dashed" />
            </div>

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

      {/* Hidden File Inputs */}
      <input type="file" accept=".jpg,.jpeg,.png,.heic" className="hidden" ref={eyeInputRef} onChange={(e) => handleFileUpload(e, 'eye')} />
      <input type="file" accept=".jpg,.jpeg,.png,.heic" className="hidden" ref={gillInputRef} onChange={(e) => handleFileUpload(e, 'gill')} />

      {/* HEADER */}
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

      {predictError && !loading && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-center justify-between">
          Gagal analisis: {predictError}
          <button onClick={() => setPredictionResult(null)} className="text-red-400 hover:text-red-700 text-xs">Tutup</button>
        </div>
      )}

      {predictionResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
              predictionResult.grade === 'A' ? 'bg-green-100 text-green-700'
              : predictionResult.grade === 'B' ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>
              {predictionResult.label}
            </span>
            <span className="text-sm text-gray-600">
              Konfidensi <strong>{predictionResult.avgConfidence}%</strong>
              {predictionResult.layak_ekspor && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Layak ekspor</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/batches/${batchId ?? 'B-2406-015'}/hasil`)}
              className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Lihat hasil batch →
            </button>
            <button onClick={() => setPredictionResult(null)} className="text-gray-400 hover:text-gray-600 text-xs ml-2">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* GRID GAMBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

        {/* KOTAK 1: MATA IKAN */}
        {eyeImg === null ? (
          <div className="border-2 border-dashed border-orange-400 bg-[#fff8f3] rounded-3xl p-6 lg:p-8 flex flex-col xl:flex-row items-center gap-6 justify-center text-center xl:text-left h-full min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <Upload className="text-orange-500" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto mata<br />ikan di sini</h3>
              <p className="text-orange-500/80 text-[11px] mt-2 leading-relaxed max-w-[200px] mx-auto xl:mx-0">
                JPG, PNG, HEIC • max 10 MB / file • CNN akan memproses otomatis setelah upload
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button onClick={() => eyeInputRef.current?.click()} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Pilih file
              </button>
              <button onClick={() => startCamera('eye')} className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
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
              <button onClick={() => eyeInputRef.current?.click()} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Ganti file
              </button>
              <button onClick={() => startCamera('eye')} className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors">
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
              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto insang<br />ikan di sini</h3>
              <p className="text-orange-500/80 text-[11px] mt-2 leading-relaxed max-w-[200px] mx-auto xl:mx-0">
                JPG, PNG, HEIC • max 10 MB / file • CNN akan memproses otomatis setelah upload
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button onClick={() => gillInputRef.current?.click()} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Pilih file
              </button>
              <button onClick={() => startCamera('gill')} className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
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
              <button onClick={() => gillInputRef.current?.click()} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Ganti file
              </button>
              <button onClick={() => startCamera('gill')} className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors">
                <Camera size={16} /> Tangkap ulang
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            {!eyeImg && !gillImg
              ? 'Upload foto mata dan insang ikan untuk mulai analisis'
              : !eyeImg || !gillImg
              ? 'Upload kedua foto untuk mengaktifkan analisis CNN'
              : '4 done • 1 uploading • 3 queued'}
          </p>
          {/* Preview hasil sementara batch ini */}
          <button
            onClick={() => navigate(`/batches/${batchId ?? 'B-2406-015'}/hasil`)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-orange-500 hover:border-orange-300 transition-colors"
          >
            <Eye size={15} />
            Preview
          </button>
        </div>
        <button
          onClick={handleStartCNN}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors ${
            isReadyToProcess && !loading
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isReadyToProcess || loading}
        >
          {loading ? 'Memproses...' : 'Lanjut ke proses CNN'}
        </button>
      </div>
    </div>
  );
};
