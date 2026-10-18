'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';
import { batchesApi, stockApi, getApiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { maskInputProfanity, checkProfanity } from '@/lib/profanity';

interface Batch { id: string; batch_number: string; current_stock: number; product: { name: string; sku: string; unit: string } }

export default function StockInPage() {
  const toast = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ batch_id: '', quantity: '', reference_no: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    batchesApi.getAll({ limit: 100 }).then((res) => setBatches(res.data.data.items)).catch(() => {});
  }, []);

  const selectedBatch = batches.find((b) => b.id === form.batch_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id || !form.quantity || Number(form.quantity) <= 0) {
      toast.warning('Pilih batch tujuan dan masukkan kuantitas masuk yang valid');
      return;
    }

    const profanity = checkProfanity(form.reference_no) || checkProfanity(form.notes);
    if (profanity) {
      toast.error(`Catatan/referensi mengandung kata kasar/terlarang ("${profanity}"). Mohon gunakan bahasa yang profesional.`);
      return;
    }

    setLoading(true);
    try {
      await stockApi.stockIn({
        batch_id: form.batch_id,
        quantity: Number(form.quantity),
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Stok masuk berhasil dicatat ke buku besar!');
      setSuccess(true);
      setForm({ batch_id: '', quantity: '', reference_no: '', notes: '' });
      // Refresh batch data
      const res = await batchesApi.getAll({ limit: 100 });
      setBatches(res.data.data.items);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mencatat stok masuk'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Penerimaan Stok Masuk</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Catat penambahan barang masuk dari supplier ke batch obat</p>
        </div>
        <span className="badge-success">
          <ArrowDownToLine className="w-3.5 h-3.5" /> Transaksi Masuk
        </span>
      </div>

      <div className="page-content">
        <div className="max-w-2xl mx-auto">
          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Transaksi Berhasil Dicatat</p>
                <p className="text-[11px] text-emerald-700">Kuantitas batch telah bertambah dan transaksi tercatat di buku besar mutasi.</p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Formulir Penerimaan Barang</h2>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Lengkapi informasi batch dan jumlah unit yang diterima</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card-body space-y-5">
              <div>
                <label className="label">Pilih Batch Tujuan <span className="text-red-500">*</span></label>
                <select
                  className="select"
                  value={form.batch_id}
                  onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                  required
                >
                  <option value="">Pilih batch obat yang tersedia...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.product?.name} (Sisa: {b.current_stock} {b.product?.unit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">{selectedBatch.product?.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      SKU: <span className="font-mono text-slate-700">{selectedBatch.product?.sku}</span> · No. Batch: <span className="font-mono text-slate-700">{selectedBatch.batch_number}</span>
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                      Stok Sekarang: <span className="text-emerald-700 font-bold">{selectedBatch.current_stock}</span> {selectedBatch.product?.unit}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Jumlah Unit Masuk (Quantity) <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="Contoh: 100"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Nomor Referensi / PO / Faktur</label>
                <input
                  className="input"
                  placeholder="Contoh: PO-2026-DEXA-001 (opsional)"
                  value={form.reference_no}
                  onChange={(e) => setForm({ ...form, reference_no: maskInputProfanity(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">Catatan Transaksi</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Keterangan pengiriman, nama supplier, atau nomor surat jalan..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: maskInputProfanity(e.target.value) })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {loading ? 'Menyimpan ke Buku Besar...' : 'Catat Stok Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
