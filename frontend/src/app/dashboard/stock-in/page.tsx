'use client';

import { useEffect, useState } from 'react';
import { ArrowDownToLine, CheckCircle } from 'lucide-react';
import { batchesApi, stockApi } from '@/lib/api';
import { useToast } from '@/lib/toast-context';

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
    if (!form.batch_id || !form.quantity) return;
    setLoading(true);
    try {
      await stockApi.stockIn({
        batch_id: form.batch_id,
        quantity: Number(form.quantity),
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Stok masuk berhasil dicatat!');
      setSuccess(true);
      setForm({ batch_id: '', quantity: '', reference_no: '', notes: '' });
      // Refresh batch data
      const res = await batchesApi.getAll({ limit: 100 });
      setBatches(res.data.data.items);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal mencatat stok masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Stok Masuk</h1>
        <span className="badge-success"><ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Stock In</span>
      </div>

      <div className="page-content">
        <div className="max-w-xl mx-auto">
          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Transaksi stok masuk berhasil dicatat ke buku besar.</p>
            </div>
          )}

          <div className="card">
            <div className="card-header">Form Penerimaan Barang</div>
            <form onSubmit={handleSubmit} className="card-body space-y-4">
              <div>
                <label className="label">Pilih Batch</label>
                <select className="select" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} required>
                  <option value="">Pilih batch tujuan...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_number} — {b.product?.name} (Stok: {b.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
                  <p className="font-medium text-neutral-800">{selectedBatch.product?.name}</p>
                  <p className="text-neutral-500">{selectedBatch.product?.sku} · Stok saat ini: <strong>{selectedBatch.current_stock}</strong> {selectedBatch.product?.unit}</p>
                </div>
              )}

              <div>
                <label className="label">Jumlah (Quantity)</label>
                <input className="input" type="number" min={1} placeholder="Masukkan jumlah" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>

              <div>
                <label className="label">No. Referensi (PO)</label>
                <input className="input" placeholder="PO-2026-DEXA-01 (opsional)" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
              </div>

              <div>
                <label className="label">Catatan</label>
                <textarea className="input" rows={3} placeholder="Keterangan tambahan (opsional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Memproses...' : 'Catat Stok Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
