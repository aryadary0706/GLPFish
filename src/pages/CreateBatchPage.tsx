import React, { useState, useMemo } from 'react';
import {
  ChevronRight, Check, X, Plus, Eye,
  Pencil, Trash2, Loader2, Save, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormField } from '../components/ui/FormField';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type BatchStatus = 'Completed' | 'Incomplete';

interface BatchItem {
  id:              string;
  date:            string;   // display: "24 Mei"
  tanggal:         string;   // ISO: "2026-05-24" — for date input
  count:           string;
  status:          BatchStatus;
  jenis:           string;
  lokasi:          string;
  estimasi_jumlah: string;
  berat_total:     string;
  catatan:         string;
}

interface FormState {
  tanggal:         string;
  jenis:           string;
  lokasi:          string;
  estimasi_jumlah: string;
  berat_total:     string;
  catatan:         string;
}

interface CreateBatchPageProps {
  onNavigateToUpload: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const JENIS_OPTIONS = ['Kakap merah', 'Tuna sirip kuning', 'Kerapu', 'Bandeng', 'Tuna'];

const INITIAL_BATCHES: BatchItem[] = [
  { id: 'B-2406-015', date: '24 Mei', tanggal: '2026-05-24', count: '120',    status: 'Completed',  jenis: 'Kakap merah',       lokasi: 'TPI Muara Angke — Jakarta Utara',  estimasi_jumlah: '120', berat_total: '48.5', catatan: 'Hasil tangkapan pagi, suhu air 27°C. Kemasan ice slurry.' },
  { id: 'B-2406-014', date: '23 Mei', tanggal: '2026-05-23', count: '88/120', status: 'Incomplete', jenis: 'Kakap merah',       lokasi: 'TPI Muara Angke — Jakarta Utara',  estimasi_jumlah: '120', berat_total: '34.1', catatan: '' },
  { id: 'B-2406-013', date: '22 Mei', tanggal: '2026-05-22', count: '142',    status: 'Completed',  jenis: 'Tuna sirip kuning', lokasi: 'TPI Nizam Zachman — Jakarta Utara', estimasi_jumlah: '142', berat_total: '71.8', catatan: 'Tangkapan malam.' },
  { id: 'B-2406-012', date: '22 Mei', tanggal: '2026-05-22', count: '64',     status: 'Completed',  jenis: 'Kerapu',            lokasi: 'TPI Muara Angke — Jakarta Utara',  estimasi_jumlah: '64',  berat_total: '22.4', catatan: '' },
  { id: 'B-2406-011', date: '21 Mei', tanggal: '2026-05-21', count: '96',     status: 'Completed',  jenis: 'Kakap merah',       lokasi: 'TPI Muara Angke — Jakarta Utara',  estimasi_jumlah: '96',  berat_total: '38.6', catatan: '' },
];

const EMPTY_FORM: FormState = {
  tanggal:         new Date().toISOString().split('T')[0],
  jenis:           'Kakap merah',
  lokasi:          'TPI Muara Angke — Jakarta Utara',
  estimasi_jumlah: '',
  berat_total:     '',
  catatan:         '',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CreateBatchPage = ({ onNavigateToUpload }: CreateBatchPageProps) => {
  const navigate = useNavigate();

  const [batches,    setBatches]    = useState<BatchItem[]>(INITIAL_BATCHES);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');

  const isEditMode = editingId !== null;

  // Auto-generate next batch ID dari list yang ada
  const nextBatchId = useMemo(() => {
    const now   = new Date();
    const yymm  = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nums  = batches
      .filter(b => b.id.startsWith(`B-${yymm}-`))
      .map(b => parseInt(b.id.split('-')[2] || '0', 10));
    const next  = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `B-${yymm}-${String(next).padStart(3, '0')}`;
  }, [batches]);

  // Controlled field setter
  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormError('');
      setForm(prev => ({ ...prev, [key]: e.target.value }));
    };
  }

  function validate(): boolean {
    if (!form.jenis)           { setFormError('Jenis ikan wajib diisi'); return false; }
    if (!form.estimasi_jumlah) { setFormError('Estimasi jumlah wajib diisi'); return false; }
    if (!form.berat_total)     { setFormError('Berat total wajib diisi'); return false; }
    return true;
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // TODO: const { data } = await api.post('/batches', {
      //   jenis:           form.jenis,
      //   tanggal:         form.tanggal,
      //   lokasi:          form.lokasi,
      //   estimasi_jumlah: Number(form.estimasi_jumlah),
      //   berat_total:     Number(form.berat_total),
      //   catatan:         form.catatan,
      // })
      // const newId = data.batch.id

      const newId   = nextBatchId;
      const today   = new Date(form.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const newBatch: BatchItem = {
        id:              newId,
        date:            today,
        tanggal:         form.tanggal,
        count:           `0/${form.estimasi_jumlah}`,
        status:          'Incomplete',
        jenis:           form.jenis,
        lokasi:          form.lokasi,
        estimasi_jumlah: form.estimasi_jumlah,
        berat_total:     form.berat_total,
        catatan:         form.catatan,
      };

      setBatches(prev => [newBatch, ...prev]);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  // ── READ / NAVIGATE ───────────────────────────────────────────────────────
  function handleBatchClick(batch: BatchItem) {
    if (batch.status === 'Completed') navigate(`/batches/${batch.id}/hasil`);
    else navigate(`/batches/${batch.id}/upload`);
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  function startEdit(batch: BatchItem) {
    setEditingId(batch.id);
    setDeletingId(null);
    setFormError('');
    setForm({
      tanggal:         batch.tanggal,
      jenis:           batch.jenis,
      lokasi:          batch.lokasi,
      estimasi_jumlah: batch.estimasi_jumlah,
      berat_total:     batch.berat_total,
      catatan:         batch.catatan,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  async function handleUpdate() {
    if (!editingId || !validate()) return;
    setSubmitting(true);
    try {
      // TODO: await api.patch(`/batches/${editingId}`, {
      //   jenis:           form.jenis,
      //   lokasi:          form.lokasi,
      //   estimasi_jumlah: Number(form.estimasi_jumlah),
      //   berat_total:     Number(form.berat_total),
      //   catatan:         form.catatan,
      // })

      const displayDate = new Date(form.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      setBatches(prev => prev.map(b =>
        b.id === editingId
          ? { ...b, tanggal: form.tanggal, date: displayDate, jenis: form.jenis, lokasi: form.lokasi, estimasi_jumlah: form.estimasi_jumlah, berat_total: form.berat_total, catatan: form.catatan }
          : b
      ));
      cancelEdit();
    } finally {
      setSubmitting(false);
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async function doDelete(id: string) {
    // TODO: await api.delete(`/batches/${id}`)
    setBatches(prev => prev.filter(b => b.id !== id));
    setDeletingId(null);
    if (editingId === id) cancelEdit();
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-white min-h-screen p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-2">
        <span className="hover:text-gray-800 cursor-pointer">Batches</span>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-gray-900 font-medium">
          {isEditMode ? `Edit ${editingId}` : 'Create batch'}
        </span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEditMode ? 'Edit batch' : 'Buat batch baru'}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ── LEFT: Form ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm w-full overflow-hidden">

          {/* Edit mode banner */}
          {isEditMode && (
            <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                <Pencil size={14} />
                Mengedit batch <span className="font-bold">{editingId}</span>
              </div>
              <button
                onClick={cancelEdit}
                className="text-orange-500 hover:text-orange-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {/* Batch ID — read-only, auto */}
              <FormField
                label="Batch ID"
                value={isEditMode ? (editingId ?? '') : nextBatchId}
                onChange={() => {}}
                readOnly
                subtext={isEditMode ? undefined : 'Auto-generated'}
              />
              <FormField
                label="Tanggal"
                type="date"
                value={form.tanggal}
                onChange={set('tanggal')}
              />
              <FormField
                label="Lokasi Pengambilan"
                value={form.lokasi}
                onChange={set('lokasi')}
              />
              <FormField
                label="Jenis Ikan"
                isSelect
                options={JENIS_OPTIONS}
                value={form.jenis}
                onChange={set('jenis')}
              />
              <FormField
                label="Estimasi Jumlah"
                type="number"
                value={form.estimasi_jumlah}
                onChange={set('estimasi_jumlah')}
                suffix="ekor"
                min="1"
              />
              <FormField
                label="Berat Total"
                type="number"
                value={form.berat_total}
                onChange={set('berat_total')}
                suffix="kg"
                step="0.1"
                min="0"
              />
            </div>

            <div className="mt-2">
              <FormField
                label="Catatan"
                type="textarea"
                value={form.catatan}
                onChange={set('catatan')}
                placeholder="Kondisi ikan, suhu air, dll."
              />
            </div>

            {/* Error message */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
                <AlertTriangle size={15} />
                {formError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#f47d31] rounded-lg hover:bg-[#e06a20] transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting
                      ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</>
                      : <><Save size={15} /> Simpan perubahan</>
                    }
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setFormError(''); }}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#f47d31] rounded-lg hover:bg-[#e06a20] transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting
                      ? <><Loader2 size={15} className="animate-spin" /> Membuat...</>
                      : <><Plus size={15} /> Buat batch & lanjut</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Batch list ── */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Batch Terakhir
            </h3>
            <span className="text-xs text-gray-400 font-medium">{batches.length} batch</span>
          </div>

          <div className="flex flex-col gap-3">
            {batches.map((batch) => {
              const isDeleting = deletingId === batch.id;
              const isBeingEdited = editingId === batch.id;

              return (
                <div
                  key={batch.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
                    isBeingEdited
                      ? 'border-orange-400 ring-1 ring-orange-200'
                      : isDeleting
                      ? 'border-red-300'
                      : 'border-gray-200'
                  }`}
                >
                  {isDeleting ? (
                    /* ── Delete confirmation ── */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle size={15} />
                        <span>Hapus batch <strong>{batch.id}</strong>?</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Data batch dan semua ikan terkait akan dihapus permanen.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => doDelete(batch.id)}
                          className="flex-1 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          Ya, hapus
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal card ── */
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => handleBatchClick(batch)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{batch.id}</h4>
                          {isBeingEdited && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded shrink-0">
                              Editing
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 truncate">
                          {batch.date} · {batch.jenis} · {batch.count} ekor
                        </p>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Status badge */}
                        {batch.status === 'Completed' ? (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-semibold">
                            <Check size={10} /> Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-600 px-2 py-1 rounded-md text-[10px] font-semibold">
                            Proses
                          </span>
                        )}

                        {/* Preview (incomplete only) */}
                        {batch.status === 'Incomplete' && (
                          <button
                            onClick={() => navigate(`/batches/${batch.id}/hasil`)}
                            title="Preview hasil sementara"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => isBeingEdited ? cancelEdit() : startEdit(batch)}
                          title={isBeingEdited ? 'Batal edit' : 'Edit batch'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isBeingEdited
                              ? 'bg-orange-100 text-orange-600'
                              : 'text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                          }`}
                        >
                          {isBeingEdited ? <X size={13} /> : <Pencil size={13} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => { setDeletingId(batch.id); setEditingId(null); }}
                          title="Hapus batch"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {batches.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Belum ada batch. Buat batch pertama!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
