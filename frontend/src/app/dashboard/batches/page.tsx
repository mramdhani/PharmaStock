'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Archive, Search, Clock, AlertTriangle } from 'lucide-react';
import { batchesApi, productsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import Modal from '@/components/Modal';

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  current_stock: number;
  product: { id: string; name: string; sku: string; unit: string };
  days_until_expiry?: number;
}

interface Product { id: string; name: string; sku: string }

export default function BatchesPage() {
  const { canMutate } = useAuth();
  const toast = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', batch_number: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await batchesApi.getAll({ search, page, limit: 10 });
      setBatches(res.data.data.items);
      setMeta(res.data.data.meta);
    } catch {
      toast.error('Gagal memuat data batch');
    } finally {
      setLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => {
    productsApi.getAll({ limit: 100 }).then((res) => setProducts(res.data.data.items)).catch(() => {});
  }, []);

  const getExpiryBadge = (b: Batch) => {
    const days = b.days_until_expiry ?? Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000);
    if (days <= 0) return <span className="badge-danger">Expired</span>;
    if (days <= 30) return <span className="badge-warning">{days} hari lagi</span>;
    if (days <= 90) return <span className="badge-info">{days} hari lagi</span>;
    return <span className="badge-success">{days} hari lagi</span>;
  };

  const handleSave = async () => {
    if (!form.product_id || !form.batch_number.trim() || !form.expiry_date) return;
    setSaving(true);
    try {
      await batchesApi.create({ ...form, batch_number: form.batch_number.toUpperCase() });
      toast.success('Batch baru berhasil ditambahkan');
      setModalOpen(false);
      setForm({ product_id: '', batch_number: '', expiry_date: '' });
      fetchBatches();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal menambahkan batch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Batch & Expiry</h1>
        {canMutate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="page-content">
        <div className="mb-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input className="input pl-9" placeholder="Cari batch..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Batch</th>
                  <th>Produk</th>
                  <th className="text-right">Stok</th>
                  <th>Tanggal Expired</th>
                  <th>Sisa Waktu</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j}><div className="skeleton h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state py-12">
                        <Archive className="empty-state-icon" />
                        <p className="empty-state-title">Belum ada batch</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const days = b.days_until_expiry ?? Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / 86400000);
                    const isExpired = days <= 0;
                    return (
                      <tr key={b.id} className={isExpired ? 'opacity-60' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{b.batch_number}</code>
                            {isExpired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                        </td>
                        <td>
                          <p className="font-medium text-neutral-900">{b.product?.name}</p>
                          <p className="text-xs text-neutral-400">{b.product?.sku}</p>
                        </td>
                        <td className="text-right font-medium">{b.current_stock.toLocaleString('id-ID')} <span className="text-xs text-neutral-400">{b.product?.unit}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {new Date(b.expiry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>{getExpiryBadge(b)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <p className="text-sm text-neutral-500">{meta.total} batch</p>
              <div className="flex gap-1">
                {[...Array(meta.totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Batch Baru"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Produk</label>
            <select className="select" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Pilih produk</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nomor Batch</label>
            <input className="input uppercase" placeholder="BAT-XXX-2026A" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="label">Tanggal Kedaluwarsa</label>
            <input className="input" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
