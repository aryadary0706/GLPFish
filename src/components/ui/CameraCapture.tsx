import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

interface CameraCaptureProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({ open, title = 'Ambil foto', onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null);
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera.');
      }
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError'
          ? 'Akses kamera ditolak. Izinkan kamera di pengaturan browser.'
          : e?.name === 'NotFoundError'
          ? 'Tidak ada kamera yang terdeteksi pada perangkat ini.'
          : e?.message || 'Gagal membuka kamera.';
      setError(msg);
    } finally {
      setStarting(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (open) {
      setSnapshot(null);
      setSnapshotBlob(null);
      startStream();
    } else {
      stopStream();
      setSnapshot(null);
      setSnapshotBlob(null);
      setError(null);
    }
    return () => stopStream();
  }, [open, startStream, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError('Stream kamera belum siap. Coba lagi.');
      return;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Gagal mengambil snapshot.');
          return;
        }
        const url = URL.createObjectURL(blob);
        setSnapshot(url);
        setSnapshotBlob(blob);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRetake = () => {
    if (snapshot) URL.revokeObjectURL(snapshot);
    setSnapshot(null);
    setSnapshotBlob(null);
  };

  const handleConfirm = () => {
    if (!snapshotBlob) return;
    const file = new File([snapshotBlob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    if (snapshot) URL.revokeObjectURL(snapshot);
    onClose();
  };

  const handleToggleFacing = () => {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Camera size={18} className="text-orange-500" />
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="bg-black aspect-video relative flex items-center justify-center">
          {error ? (
            <div className="text-center text-white px-6">
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={startStream}
                className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                Coba lagi
              </button>
            </div>
          ) : snapshot ? (
            <img src={snapshot} alt="Snapshot" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}
          {starting && !error && !snapshot && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Membuka kamera...
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-3 border-t border-gray-100">
          {snapshot ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw size={16} /> Ambil ulang
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
              >
                <Check size={16} /> Gunakan foto
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleToggleFacing}
                disabled={!!error}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={16} /> Balik kamera
              </button>
              <button
                onClick={handleCapture}
                disabled={!!error || starting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Camera size={16} /> Jepret
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
