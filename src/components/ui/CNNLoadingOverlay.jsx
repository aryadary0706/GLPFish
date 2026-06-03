import React, { useEffect, useRef, useState } from 'react';

export default function CNNLoadingOverlay({ visible }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(intervalRef.current);
            return 85;
          }
          return Math.min(85, prev + Math.random() * 2.5 + 0.5);
        });
      }, 180);
    } else {
      clearInterval(intervalRef.current);
      setProgress(0);
    }
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center">
      <div className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-6 w-[340px] shadow-2xl">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">Menganalisis gambar...</h2>
          <p className="text-sm text-gray-400 mt-1">Model CNN sedang memproses</p>
        </div>

        {/* Scanning box */}
        <div
          className="relative rounded-[20px] border-2 border-[#f58220] overflow-hidden"
          style={{
            width: 200,
            height: 200,
            background: '#fff4e8',
            backgroundImage:
              'repeating-linear-gradient(45deg, #f1f2f4 0px, #f1f2f4 3px, transparent 3px, transparent 16px)',
          }}
        >
          {/* Inner dashed border */}
          <div className="absolute inset-3 rounded-[14px] border-2 border-dashed border-[#f58220] opacity-50 pointer-events-none" />

          {/* Scan line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 3,
              background: '#f58220',
              borderRadius: 2,
              boxShadow: '0 0 16px 4px #f58220',
              animation: 'cnnScan 1.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-2 bg-[#f1f2f4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(to right, #f58220, #e36a0a)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <p className="text-right text-[11px] text-gray-400 mt-1">{Math.round(progress)}%</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-start w-full justify-center gap-0">
          {/* Step 1: Upload – done */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-[22px] h-[22px] rounded-full bg-[#16a34a] flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">Upload<br/>gambar</span>
          </div>

          {/* Connector */}
          <div className="flex-1 h-px bg-gray-200 mt-[11px] mx-1.5" />

          {/* Step 2: CNN – active */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-[22px] h-[22px] rounded-full bg-[#f58220] flex items-center justify-center shrink-0 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="text-[10px] font-bold text-[#f58220] text-center leading-tight">Analisis<br/>CNN</span>
          </div>

          {/* Connector */}
          <div className="flex-1 h-px bg-gray-200 mt-[11px] mx-1.5" />

          {/* Step 3: Simpan – pending */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-[22px] h-[22px] rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 text-center leading-tight">Simpan<br/>hasil</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cnnScan {
          0%   { top: 0px; }
          50%  { top: calc(100% - 3px); }
          100% { top: 0px; }
        }
      `}</style>
    </div>
  );
}
