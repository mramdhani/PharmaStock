'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Power, Package, Search, AlertTriangle } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import Modal from '@/components/Modal';

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  minimum_stock: number;
  is_active: boolean;
  category: { id: string; name: string };
  total_stock: number;
  is_low_stock: boolean;
}

interface Category {
  id: string;
  name: string;
}

const emptyForm = { name: '', sku: '', unit: 'Tablet', minimum_stock: 10, category_id: '' };

export default function ProductsPage() {
  const { canMutate } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsApi.getAll({ search, page, limit: 10 });
      setProducts(res.data.data.items);
      setMeta(res.data.data.meta);
    } catch {
      toast.error('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  }, [search, page, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll({ limit: 100 });
      setCategories(res.data.data.items);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      minimum_stock: p.minimum_stock,
      category_id: p.category?.id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.category_id) return;
    setSaving(true);
    try {
      if (editId) {
        await productsApi.update(editId, form);
        toast.success('Produk berhasil diperbarui');
      } else {
        await productsApi.create(form);
        toast.success('Produk berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await productsApi.update(p.id, { is_active: !p.is_active });
      toast.success(p.is_active ? 'Produk dinonaktifkan' : 'Produk diaktifkan kembali');
      fetchProducts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal mengubah status');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Produk</h1>
        {canMutate && (
          <button onClick={openCreate} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="page-content">
        <div className="mb-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            className="input pl-9"
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Unit</th>
                  <th className="text-right">Stok</th>
                  <th>Status</th>
                  {canMutate && <th className="w-28 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(canMutate ? 7 : 6)].map((__, j) => (
                        <td key={j}><div className="skeleton h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={canMutate ? 7 : 6}>
                      <div className="empty-state py-12">
                        <Package className="empty-state-icon" />
                        <p className="empty-state-title">Belum ada produk</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id}>
                      <td><code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{p.sku}</code></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{p.name}</span>
                          {p.is_low_stock && (
                            <span title="Stok menipis" className="text-amber-500"><AlertTriangle className="w-3.5 h-3.5" /></span>
                          )}
                        </div>
                      </td>
                      <td>{p.category?.name}</td>
                      <td>{p.unit}</td>
                      <td className="text-right font-medium">
                        <span className={p.is_low_stock ? 'text-amber-600' : 'text-neutral-900'}>
                          {p.total_stock?.toLocaleString('id-ID') ?? 0}
                        </span>
                      </td>
                      <td>
                        <span className={p.is_active ? 'badge-success' : 'badge-neutral'}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      {canMutate && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="btn-ghost btn-sm">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleActive(p)} className="btn-ghost btn-sm" title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                              <Power className={`w-3.5 h-3.5 ${p.is_active ? 'text-red-500' : 'text-green-500'}`} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <p className="text-sm text-neutral-500">{meta.total} produk</p>
              <div className="flex gap-1">
                {[...Array(meta.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Produk' : 'Tambah Produk'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Kategori</label>
            <select className="select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU</label>
              <input className="input uppercase" placeholder="MED-XXX-000" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="label">Nama Produk</label>
              <input className="input" placeholder="Amoxicillin 500mg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Satuan</label>
              <select className="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['Tablet', 'Kapsul', 'Botol', 'Ampul', 'Tube', 'Sachet', 'Box', 'Strip'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Minimum Stok</label>
              <input className="input" type="number" min={0} value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
