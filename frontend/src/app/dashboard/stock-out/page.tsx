'use client';

import { useEffect, useState } from 'react';
import { ArrowUpFromLine, CheckCircle, PackageMinus, AlertCircle } from 'lucide-react';
import { batchesApi, stockApi, getApiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { maskInputProfanity, checkProfanity } from '@/lib/profanity';

interface Batch { id: string; batch_number: string; current_stock: number; product: { name: string; sku: string; unit: string } }

export default function StockOutPage() {
  const toast = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ batch_id: '', quantity: '', reference_no: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    batchesApi.getAll({ limit: 100, has_stock: true }).then((res) => setBatches(res.data.data.items)).catch(() => {});
  }, []);

  const selectedBatch = batches.find((b) => b.id === form.batch_id);
  const isOverQuantity = selectedBatch ? Number(form.quantity) > selectedBatch.current_stock : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id || !form.quantity || Number(form.quantity) <= 0) {
      toast.warning('Pilih batch dan tentukan kuantitas keluar yang valid');
      return;
    }
    if (isOverQuantity) {
      toast.warning('Kuantitas keluar melebihi stok batch yang tersedia');
      return;
    }

    const profanity = checkProfanity(form.reference_no) || checkProfanity(form.notes);
    if (profanity) {
      toast.error(`Catatan/referensi mengandung kata kasar/terlarang ("${profanity}"). Mohon gunakan bahasa yang profesional.`);
      return;
    }

    setLoading(true);
    try {
      await stockApi.stockOut({
        batch_id: form.batch_id,
        quantity: Number(form.quantity),
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Stok keluar berhasil dicatat ke buku besar!');
      setSuccess(true);
      setForm({ batch_id: '', quantity: '', reference_no: '', notes: '' });
      const res = await batchesApi.getAll({ limit: 100, has_stock: true });
      setBatches(res.data.data.items);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mencatat stok keluar'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengeluaran Stok Obat</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Catat pengeluaran obat untuk distribusi RS / apotek / klinik</p>
        </div>
        <span className="badge-danger">
          <ArrowUpFromLine className="w-3.5 h-3.5" /> Transaksi Keluar
        </span>
      </div>

      <div className="page-content">
        <div className="max-w-2xl mx-auto">
          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Transaksi Berhasil Dicatat</p>
                <p className="text-[11px] text-emerald-700">Kuantitas batch telah dikurangi dan tercatat di buku besar mutasi.</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Formulir Pengeluaran Barang</h2>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Pilih batch asal dan pastikan kuantitas tidak melebihi saldo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card-body space-y-5">
              <div>
                <label className="label">Pilih Batch Asal <span className="text-red-500">*</span></label>
                <select
                  className="select"
                  value={form.batch_id}
                  onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                  required
                >
                  <option value="">Pilih batch asal (hanya yang memiliki saldo)...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.product?.name} (Saldo: {b.current_stock} {b.product?.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 text-[#c41230] flex items-center justify-center shrink-0">
                    <PackageMinus className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">{selectedBatch.product?.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      SKU: <span className="font-mono text-slate-700">{selectedBatch.product?.sku}</span> · No. Batch: <span className="font-mono text-slate-700">{selectedBatch.batch_number}</span>
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                      Saldo Tersedia: <span className="text-[#c41230] font-bold">{selectedBatch.current_stock}</span> {selectedBatch.product?.unit}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Jumlah Unit Keluar (Quantity) <span className="text-red-500">*</span></label>
                <input
                  className={`input ${isOverQuantity ? 'input-error' : ''}`}
                  type="number"
                  min={1}
                  max={selectedBatch?.current_stock || undefined}
                  placeholder="Masukkan jumlah yang dikeluarkan"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
                {isOverQuantity && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Kuantitas melebihi sisa stok yang tersedia ({selectedBatch?.current_stock} unit)
                  </p>
                )}
              </div>

              <div>
                <label className="label">Nomor Referensi (DO / Resep / SPK)</label>
                <input
                  className="input"
                  placeholder="Contoh: DO-2026-RS-001 (opsional)"
                  value={form.reference_no}
                  onChange={(e) => setForm({ ...form, reference_no: maskInputProfanity(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">Catatan Distribusi</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Tujuan distribusi (Nama RS / Apotek / Unit Farmasi)..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: maskInputProfanity(e.target.value) })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isOverQuantity || !form.batch_id || !form.quantity}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  {loading ? 'Menyimpan ke Buku Besar...' : 'Catat Stok Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
