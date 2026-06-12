import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  ChevronRight,
  Upload,
  X,
  BrainCircuit
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import CNNLoadingOverlay from '../components/ui/CNNLoadingOverlay';
import CameraCapture from '../components/ui/CameraCapture';
import api from '../lib/api';

interface UploadPageProps {

  onBack: () => void;

}

export const UploadPhotoPage = ({ onBack }: UploadPageProps) => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();

  // Preview URLs (Untuk ditampilkan di UI)
  const [uploadedCount, setUploadedCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [eyeImg, setEyeImg] = useState<string | null>(null);
  const [gillImg, setGillImg] = useState<string | null>(null);
  // Actual File objects (Untuk dikirim ke Backend)
  const [eyeFile, setEyeFile] = useState<File | null>(null);
  const [gillFile, setGillFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraOpenFor, setCameraOpenFor] = useState<'eye' | 'gill' | null>(null);

  const isFull = uploadedCount >= targetCount && targetCount > 0;
  const isReadyToProcess = eyeImg !== null && gillImg !== null;
  const willBeCount = uploadedCount + 1;
  const isLastFish = willBeCount >= targetCount;

  // Fetch data progress
  useEffect(() => {
    const fetchBatchProgress = async () => {
      try {
        const response = await api.get('/batches');
        const batchList = response.data?.batches || response.data || [];
        const currentBatch = batchList.find((b: any) => b.id === batchId);
        if (currentBatch) {
          setUploadedCount(currentBatch.total_uploaded || 0); 
          setTargetCount(currentBatch.estimasi_jumlah || 0);
        }
      } catch (error) { console.error("Gagal ambil progres:", error); }
    };
    if (batchId) fetchBatchProgress();
  }, [batchId]);

  // Refs untuk input file (Galeri)
  const eyeInputRef = useRef<HTMLInputElement>(null);
  const gillInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleCameraCapture = (file: File, type: 'eye' | 'gill') => {
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`Gagal upload. Ukuran file kamera terlalu besar (Max 10 MB).`);
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

  // HANDLE FILE (DARI GALERI ATAU KAMERA NATIVE)

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

  // HIT API POST /api/upload/images (SAVE ONLY)

  const handleSaveToBatch = async () => {
    if (isFull) {
      setUploadError("Batch sudah penuh! Silakan lakukan Prediksi.");
      return;
    }

    if (!eyeFile || !gillFile) return;

    // setUploadError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('eye', eyeFile);
      formData.append('gill', gillFile);
      formData.append('batch_id', batchId || '');
      await api.post('/upload/images', formData);


      // GANTI fetch MENTAH DENGAN api.post DARI AXIOS

      // const response = await api.post('/upload/images', formData);

      alert('Foto ikan berhasil ditambahkan ke batch!');
      setUploadedCount(prev => prev + 1);

      setEyeImg(null);
      setGillImg(null);
      setEyeFile(null);
      setGillFile(null);

      if (eyeInputRef.current) eyeInputRef.current.value = '';
      if (gillInputRef.current) gillInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload Error:', err);
      // Tangkap pesan error dari Axios
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Terjadi kesalahan saat menyimpan foto.';
      setUploadError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPredict = async () => {
    if (!eyeFile || !gillFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('eye', eyeFile);
      formData.append('gill', gillFile);
      formData.append('batch_id', batchId || '');

      // 1. Upload dulu ke backend lokal (lokal akan simpan ke DB & panggil AI HF)
      await api.post('/upload/images', formData);

      // 2. Trigger proses prediksi di backend lokal
      // Kita panggil endpoint backend lokal yang sudah kita arahkan ke Hugging Face tadi
      await api.post('/inspections/predict', { 
        batch_id: batchId 
      });

      // 3. Kalau sukses, baru pindah halaman
      navigate(`/batches/${batchId}/hasil`);
    } catch (err) {
      console.error("Predict Error:", err);
      setUploadError('Gagal menjalankan proses. Pastikan semua file terupload dengan benar.');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="flex-1 bg-white min-h-screen p-8 max-w-6xl mx-auto flex flex-col relative">
      <CNNLoadingOverlay visible={loading} />
      {/* ==========================================

          HIDDEN INPUTS (NATIVE FILE & CAMERA)

          ========================================== */}

      {/* Input untuk Mata (galeri) */}
      <input type="file" accept="image/*" className="hidden" ref={eyeInputRef} onChange={(e) => handleFileUpload(e, 'eye')} />

      {/* Input untuk Insang (galeri) */}
      <input type="file" accept="image/*" className="hidden" ref={gillInputRef} onChange={(e) => handleFileUpload(e, 'gill')} />

      {/* Modal kamera live */}
      <CameraCapture
        open={cameraOpenFor !== null}
        title={cameraOpenFor === 'eye' ? 'Ambil foto mata ikan' : 'Ambil foto insang ikan'}
        onClose={() => setCameraOpenFor(null)}
        onCapture={(file) => {
          if (cameraOpenFor) handleCameraCapture(file, cameraOpenFor);
        }}
      />



      {/* HEADER */}

      <div className="flex items-center text-sm text-gray-500 mb-2">

        <span className="hover:text-gray-800 cursor-pointer" onClick={onBack}>Batches</span>

        <ChevronRight size={14} className="mx-1" />

        <span className="hover:text-gray-800 cursor-pointer" onClick={onBack}>{batchId}</span>

        <ChevronRight size={14} className="mx-1" />

        <span className="text-gray-900 font-medium">Upload</span>

      </div>



      <div className="flex justify-between items-end mb-6">

        <div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Upload gambar ikan</h1>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress Upload</span>
              <span>{uploadedCount}/{targetCount}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{
                  width:
                    targetCount > 0
                      ? `${(uploadedCount / targetCount) * 100}%`
                      : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-center justify-between">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-700">
            <X size={18} />
          </button>
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button onClick={() => eyeInputRef.current?.click()} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Pilih file
              </button>

              <button onClick={() => setCameraOpenFor('eye')} className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
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

              <button onClick={() => setCameraOpenFor('eye')} className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors">

                <Camera size={16} /> Kamera ulang

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

            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button onClick={() => gillInputRef.current?.click()} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
                <Upload size={16} /> Pilih file
              </button>

              <button onClick={() => setCameraOpenFor('gill')} className="bg-white text-orange-500 border border-orange-300 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors">
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

              <button onClick={() => setCameraOpenFor('gill')} className="bg-white text-orange-500 border border-orange-300 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-colors">
                <Camera size={16} /> Kamera ulang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">

          {isLastFish ? (

            <button
              onClick={handleSaveAndPredict}
              disabled={!isReadyToProcess || loading}
              className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${isReadyToProcess && !loading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              <BrainCircuit size={18} />
              Save & Predict
            </button>

          ) : (

            <button
              onClick={handleSaveToBatch}
              disabled={!isReadyToProcess || loading}
              className={`px-8 py-3 rounded-xl text-sm font-bold ${isReadyToProcess && !loading
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Save to Batch
            </button>

          )}

        </div>

      </div>
    </div>
  );
};;