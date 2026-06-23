import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  ChevronRight,
  Upload,
  X,
  BrainCircuit,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CNNLoadingOverlay from '../components/ui/CNNLoadingOverlay';
import CameraCapture from '../components/ui/CameraCapture';
import api from '../lib/api';

interface UploadPageProps {

  onBack: () => void;

}

export const UploadPhotoPage = ({ onBack }: UploadPageProps) => {
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [searchParams] = useSearchParams();
  const retakeFishId = searchParams.get('retake');
  const retakeIndexParam = searchParams.get('index');
  const isRetakeMode = Boolean(retakeFishId);

  // Preview URLs (Untuk ditampilkan di UI)
  const [uploadedCount, setUploadedCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(
    retakeIndexParam ? Number(retakeIndexParam) : null
  );
  const [eyeImg, setEyeImg] = useState<string | null>(null);
  const [gillImg, setGillImg] = useState<string | null>(null);
  // Actual File objects (Untuk dikirim ke Backend)
  const [eyeFile, setEyeFile] = useState<File | null>(null);
  const [gillFile, setGillFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraOpenFor, setCameraOpenFor] = useState<'eye' | 'gill' | null>(null);
  // True jika foto terakhir sudah ke-upload tapi predict gagal — supaya retry tidak upload ulang.
  const [predictRetryPending, setPredictRetryPending] = useState(false);

  const isFull = uploadedCount >= targetCount && targetCount > 0;
  const isReadyToProcess = eyeImg !== null && gillImg !== null;
  const willBeCount = uploadedCount + 1;
  const isLastFish = willBeCount >= targetCount;
  const canSeeIntermediateResult = !isRetakeMode && (uploadedCount > 0 || predictRetryPending);

  // Fetch data progress + redirect kalau batch sudah final
  useEffect(() => {
    const fetchBatchProgress = async () => {
      try {
        const response = await api.get('/batches');
        const batchList = response.data?.batches || response.data || [];
        const currentBatch = batchList.find((b: any) => b.id === batchId);
        if (currentBatch) {
          // Auto-redirect ke Hasil kalau batch sudah saved/rejected (final).
          // Jangan redirect saat retake mode karena retake harus pakai upload page.
          if (!isRetakeMode && (currentBatch.status === 'saved' || currentBatch.status === 'rejected')) {
            navigate(`/batches/${batchId}/hasil`, { replace: true });
            return;
          }
          setUploadedCount(currentBatch.total_uploaded || 0);
          setTargetCount(currentBatch.estimasi_jumlah || 0);
        }
      } catch { /* silent — bukan error fatal untuk user */ }
    };
    if (batchId) fetchBatchProgress();
  }, [batchId, isRetakeMode, navigate]);

  // Jika retake mode tapi tidak ada index di query, ambil dari endpoint fishes
  useEffect(() => {
    if (!isRetakeMode || retakeIndex !== null || !batchId) return;
    const fetchFishIndex = async () => {
      try {
        const { data } = await api.get(`/batches/${batchId}/fishes`);
        const list = data?.fishes || [];
        const target = list.find((f: any) => f.id === retakeFishId);
        if (target) setRetakeIndex(target.fish_index);
      } catch { /* silent — fetch index opsional */ }
    };
    fetchFishIndex();
  }, [isRetakeMode, retakeIndex, batchId, retakeFishId]);

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

  const acceptFile = (file: File, type: 'eye' | 'gill'): boolean => {
    if (!file.type.startsWith('image/')) {
      setUploadError(`File "${file.name}" bukan gambar.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`Gagal upload. Ukuran file "${file.name}" terlalu besar (Max 10 MB).`);
      return false;
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
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'eye' | 'gill') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ok = acceptFile(file, type);
    if (!ok) event.target.value = '';
  };

  // DRAG & DROP STATE
  const [dragOver, setDragOver] = useState<'eye' | 'gill' | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, type: 'eye' | 'gill') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    if (dragOver !== type) setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'eye' | 'gill') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    acceptFile(file, type);
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
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Terjadi kesalahan saat menyimpan foto.';
      setUploadError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeSubmit = async () => {
    if (!eyeFile || !gillFile || !retakeFishId) return;
    setLoading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('eye', eyeFile);
      formData.append('gill', gillFile);
      formData.append('fish_id', retakeFishId);
      await api.post('/upload/replace', formData);
      navigate(`/batches/${batchId}/hasil`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Gagal mengganti foto ikan.';
      setUploadError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPredict = async () => {
    if (!predictRetryPending && (!eyeFile || !gillFile)) return;

    setLoading(true);
    setUploadError(null);

    try {
      // 1. Upload foto ikan terakhir — skip jika sebelumnya sudah berhasil & sedang retry predict
      if (!predictRetryPending) {
        const formData = new FormData();
        formData.append('eye', eyeFile!);
        formData.append('gill', gillFile!);
        formData.append('batch_id', batchId || '');
        await api.post('/upload/images', formData);

        setUploadedCount(prev => prev + 1);
        setEyeImg(null);
        setGillImg(null);
        setEyeFile(null);
        setGillFile(null);
        if (eyeInputRef.current) eyeInputRef.current.value = '';
        if (gillInputRef.current) gillInputRef.current.value = '';
        setPredictRetryPending(true);
      }

      // 2. Trigger proses prediksi
      await api.post('/inspections/predict', { batch_id: batchId });

      // 3. Sukses — pindah halaman
      setPredictRetryPending(false);
      navigate(`/batches/${batchId}/hasil`);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      const status = err?.response?.status;
      if (status === 503) {
        setUploadError(backendMsg || 'Model AI sedang cold start. Tunggu ~30 detik lalu klik "Coba prediksi lagi" — foto Anda tetap tersimpan.');
      } else if (backendMsg) {
        setUploadError(backendMsg);
      } else {
        setUploadError('Gagal menjalankan proses. Pastikan semua file terupload dengan benar.');
      }
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

        <span className="text-gray-900 font-medium">{isRetakeMode ? 'Retake' : 'Upload'}</span>

      </div>



      <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">

        <div className="flex-1 min-w-[260px]">

          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isRetakeMode
              ? `Retake foto Ikan${retakeIndex ? ` #${retakeIndex}` : ''}`
              : 'Upload gambar ikan'}
          </h1>
          {isRetakeMode ? (
            <p className="text-sm text-gray-500 mt-1">
              Ambil ulang foto mata & insang. Foto lama akan diganti dan prediksi otomatis dijalankan ulang.
            </p>
          ) : (
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
          )}
        </div>
        {canSeeIntermediateResult && (
          <button
            onClick={() => navigate(`/batches/${batchId}/hasil`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors"
          >
            <Eye size={16} /> Lihat hasil sementara
          </button>
        )}
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

          <div
            onDragOver={(e) => handleDragOver(e, 'eye')}
            onDragEnter={(e) => handleDragOver(e, 'eye')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'eye')}
            className={`border-2 border-dashed rounded-3xl p-6 lg:p-8 flex flex-col xl:flex-row items-center gap-6 justify-center text-center xl:text-left h-full min-h-[300px] transition-colors ${dragOver === 'eye' ? 'border-orange-600 bg-orange-100 ring-4 ring-orange-200' : 'border-orange-400 bg-[#fff8f3]'}`}
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm pointer-events-none">
              <Upload className="text-orange-500" size={28} />
            </div>

            <div className="flex-1 pointer-events-none">
              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto mata<br />ikan di sini</h3>
              <p className="text-xs text-orange-500/80 mt-1">atau pilih file / pakai kamera</p>
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

          <div
            onDragOver={(e) => handleDragOver(e, 'eye')}
            onDragEnter={(e) => handleDragOver(e, 'eye')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'eye')}
            className={`border-2 border-dashed rounded-3xl p-6 flex flex-col h-full min-h-[400px] transition-colors ${dragOver === 'eye' ? 'border-orange-600 bg-orange-100 ring-4 ring-orange-200' : 'border-orange-400 bg-[#fff8f3]'}`}
          >

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

          <div
            onDragOver={(e) => handleDragOver(e, 'gill')}
            onDragEnter={(e) => handleDragOver(e, 'gill')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'gill')}
            className={`border-2 border-dashed rounded-3xl p-6 lg:p-8 flex flex-col xl:flex-row items-center gap-6 justify-center text-center xl:text-left h-full min-h-[300px] transition-colors ${dragOver === 'gill' ? 'border-orange-600 bg-orange-100 ring-4 ring-orange-200' : 'border-orange-400 bg-[#fff8f3]'}`}
          >

            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm pointer-events-none">

              <Upload className="text-orange-500" size={28} />

            </div>

            <div className="flex-1 pointer-events-none">

              <h3 className="text-orange-600 font-bold text-lg leading-tight">Drop foto insang<br />ikan di sini</h3>
              <p className="text-xs text-orange-500/80 mt-1">atau pilih file / pakai kamera</p>

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

          <div
            onDragOver={(e) => handleDragOver(e, 'gill')}
            onDragEnter={(e) => handleDragOver(e, 'gill')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'gill')}
            className={`border-2 border-dashed rounded-3xl p-6 flex flex-col h-full min-h-[400px] transition-colors ${dragOver === 'gill' ? 'border-orange-600 bg-orange-100 ring-4 ring-orange-200' : 'border-orange-400 bg-[#fff8f3]'}`}
          >
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

          {isRetakeMode ? (
            <>
              <button
                onClick={() => navigate(`/batches/${batchId}/hasil`)}
                disabled={loading}
                className="px-5 py-3 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleRetakeSubmit}
                disabled={!isReadyToProcess || loading}
                className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${isReadyToProcess && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <RefreshCw size={18} />
                Simpan & prediksi ulang
              </button>
            </>
          ) : predictRetryPending ? (

            <button
              onClick={handleSaveAndPredict}
              disabled={loading}
              className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 ${loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
              <RefreshCw size={18} />
              Coba prediksi lagi
            </button>

          ) : isLastFish ? (

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