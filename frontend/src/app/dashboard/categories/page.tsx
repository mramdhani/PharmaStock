'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Layers, Search } from 'lucide-react';
import { categoriesApi, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { maskInputProfanity, checkProfanity } from '@/lib/profanity';
import Modal from '@/components/Modal';

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function CategoriesPage() {
  const { canMutate } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll({ search, limit: 100 });
      setCategories(res.data.data.items);
    } catch {
      toast.error('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setName('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Nama kategori wajib diisi');
      return;
    }

    const profanity = checkProfanity(name);
    if (profanity) {
      toast.error(`Input nama kategori mengandung kata kasar/terlarang ("${profanity}"). Mohon gunakan istilah farmasi yang sopan.`);
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await categoriesApi.update(editId, { name: name.trim() });
        toast.success(`Kategori "${name.trim()}" berhasil diperbarui`);
      } else {
        await categoriesApi.create({ name: name.trim() });
        toast.success(`Kategori "${name.trim()}" berhasil ditambahkan`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan kategori'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Hapus kategori "${catName}"?`)) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Kategori berhasil dihapus');
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal menghapus kategori');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Kategori</h1>
        {canMutate && (
          <button onClick={openCreate} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      <div className="page-content">
        {/* Search */}
        <div className="relative w-full max-w-sm mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            className="input !pl-10"
            placeholder="Cari kategori obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Dibuat</th>
                  {canMutate && <th className="w-28 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton h-4 w-40" /></td>
                      <td><div className="skeleton h-4 w-24" /></td>
                      {canMutate && <td />}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={canMutate ? 3 : 2}>
                      <div className="empty-state py-12">
                        <Layers className="empty-state-icon" />
                        <p className="empty-state-title">Belum ada kategori</p>
                        <p className="empty-state-desc">Klik tombol &quot;Tambah&quot; untuk menambahkan kategori baru.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="font-medium text-neutral-900">{cat.name}</td>
                      <td className="text-neutral-500">
                        {new Date(cat.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {canMutate && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(cat)} className="btn-ghost btn-sm">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(cat.id, cat.name)} className="btn-ghost btn-sm text-red-500 hover:text-red-700">
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Kategori' : 'Tambah Kategori'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div>
          <label className="label">Nama Kategori <span className="text-red-500">*</span></label>
          <input
            className="input"
            placeholder="Contoh: Analgesic, Antibiotic..."
            value={name}
            onChange={(e) => setName(maskInputProfanity(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}
