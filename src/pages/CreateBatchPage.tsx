import React from 'react';
import { Camera, ChevronRight, Check, X, Plus } from 'lucide-react';
import { FormField } from '../components/ui/FormField';

interface BatchItem {
  id: string;
  date: string;
  count: string;
  status: 'Completed' | 'Incomplete';
}

interface CreateBatchPageProps {
  onNavigateToUpload: () => void;
}

export const CreateBatchPage = ({ onNavigateToUpload }: CreateBatchPageProps) => {
  const recentBatches: BatchItem[] = [
    { id: 'B-2406-014', date: '23 Mei', count: '88/120', status: 'Incomplete' },
    { id: 'B-2406-013', date: '22 Mei', count: '142', status: 'Completed' },
    { id: 'B-2406-012', date: '22 Mei', count: '64', status: 'Completed' },
    { id: 'B-2406-011', date: '21 Mei', count: '96', status: 'Completed' },
  ];

  return (
    <div className="flex-1 bg-white min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span className="hover:text-gray-800 cursor-pointer">Batches</span>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-gray-900 font-medium">Create batch</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Buat batch baru</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField label="Batch ID" defaultValue="B-2406-015" subtext="Auto-generated" readOnly />
            <FormField label="Tanggal" defaultValue="24 Mei 2026" />
            <FormField label="Lokasi Pengambilan" defaultValue="TPI Muara Angke — Jakarta Utara" />
            <FormField label="Jenis Ikan" isSelect options={['Kakap merah', 'Tuna', 'Kerapu']} />
            <FormField label="Estimasi Jumlah" defaultValue="120" suffix="ekor" />
            <FormField label="Berat Total" defaultValue="48.5" suffix="kg" />
          </div>

          <div className="mt-2">
            <FormField label="Catatan" type="textarea" defaultValue="Hasil tangkapan pagi, suhu air 27°C. Kemasan ice slurry." />
          </div>

          <div className="bg-orange-50 rounded-xl p-4 flex items-start gap-3 mt-4 mb-8">
            <div className="bg-orange-500 text-white p-2 rounded-lg shrink-0 mt-0.5">
              <Camera size={20} />
            </div>
            <div>
              <h4 className="text-orange-700 font-bold text-sm">Setelah batch dibuat</h4>
              <p className="text-orange-600/80 text-sm mt-0.5">
                Anda akan diarahkan ke layar pengambilan gambar untuk meng-upload foto ikan satu per satu.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button 
              onClick={onNavigateToUpload}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#f47d31] rounded-lg hover:bg-[#e06a20] transition-colors flex items-center gap-1"
            >
              Buat batch & lanjut <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[320px]">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            Batch Terakhir
          </h3>
          <div className="flex flex-col gap-3">
            {recentBatches.map((batch, idx) => (
              <div 
                key={idx} 
                onClick={() => batch.status === 'Incomplete' ? onNavigateToUpload() : null}
                className={`bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm ${batch.status === 'Incomplete' ? 'hover:border-orange-400 cursor-pointer' : 'cursor-default'}`}
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">{batch.id}</h4>
                  <p className="text-[13px] text-gray-500">{batch.date} • {batch.count} ikan</p>
                </div>
                <div className="flex items-center gap-3">
                  {batch.status === 'Completed' ? (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-[11px] font-semibold"><Check size={12} /> Completed</span>
                  ) : (
                    <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md text-[11px] font-semibold"><X size={12} /> Incomplete</span>
                  )}
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};