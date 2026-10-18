'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Users, Pencil, Shield, UserCog, BookOpen, RotateCcw } from 'lucide-react';
import { usersApi, systemApi, getApiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { maskInputProfanity, checkProfanity } from '@/lib/profanity';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'VIEWER';
  is_active: boolean;
  created_at: string;
}

const roleIcons = { ADMIN: Shield, STAFF: UserCog, VIEWER: BookOpen };
const roleBadges = { ADMIN: 'badge-danger', STAFF: 'badge-info', VIEWER: 'badge-neutral' };

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF' | 'VIEWER';
}

const emptyForm: UserForm = { name: '', email: '', password: '', role: 'STAFF' };

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.getAll({ limit: 100 });
      setUsers(res.data.data.items);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.warning('Nama lengkap pengguna wajib diisi');
      return;
    }
    if (!form.email.trim()) {
      toast.warning('Alamat email pengguna wajib diisi');
      return;
    }

    const profanity = checkProfanity(form.name) || checkProfanity(form.email);
    if (profanity) {
      toast.error(`Input nama/email mengandung kata kasar/terlarang ("${profanity}"). Mohon gunakan nama yang sopan.`);
      return;
    }

    if (!editId && !form.password) {
      toast.warning('Kata sandi wajib diisi untuk pengguna baru');
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.warning('Kata sandi minimal 6 karakter');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        const payload: Record<string, unknown> = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await usersApi.update(editId, payload);
        toast.success(`Data pengguna "${form.name}" berhasil diperbarui`);
      } else {
        await usersApi.create(form);
        toast.success(`Pengguna "${form.name}" berhasil ditambahkan`);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal menyimpan pengguna'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await usersApi.update(u.id, { is_active: !u.is_active });
      toast.success(u.is_active ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan kembali');
      fetchUsers();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Gagal mengubah status'));
    }
  };

  const handleResetDemo = async () => {
    if (
      !window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mereset seluruh data demo kembali ke kondisi standar pabrik? Seluruh produk, batch, dan pergerakan stok uji coba akan dikembalikan ke data awal Dexa Group.',
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      await systemApi.resetDemo();
      toast.success('Database demo berhasil dipulihkan ke kondisi standar pabrik!');
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Gagal memulihkan database demo');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Manajemen Pengguna</h1>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Bergabung</th>
                  <th className="w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j}><div className="skeleton h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="!py-4 !px-0">
                      <EmptyState
                        icon={Users}
                        title="Belum ada pengguna"
                        description={
                          canMutate
                            ? 'Klik tombol "+ Tambah" di atas untuk mendaftarkan akun staf atau apoteker baru.'
                            : 'Belum ada data pengguna yang terdaftar.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const RoleIcon = roleIcons[u.role];
                    return (
                      <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium text-neutral-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="text-neutral-600">{u.email}</td>
                        <td>
                          <span className={roleBadges[u.role]}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={u.is_active ? 'badge-success' : 'badge-neutral'}>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="text-neutral-500 text-sm">
                          {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(u)} className="btn-ghost btn-sm">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleActive(u)} className={`btn-ghost btn-sm text-xs ${u.is_active ? 'text-red-500' : 'text-green-500'}`}>
                              {u.is_active ? 'Off' : 'On'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Pemeliharaan Lingkungan Demo */}
        <div className="card border border-red-200 bg-red-50/40 p-5 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" /> Pemeliharaan & Reset Database Demo
              </h3>
              <p className="text-xs text-red-700/80 mt-1">
                Jika produk, batch, atau stok diacak-acak oleh pengunjung publik, Admin dapat memulihkan seluruh data kembali ke kondisi awal Dexa Group secara instan.
              </p>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="btn-danger btn-sm whitespace-nowrap"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Memulihkan Data...' : 'Reset Data Demo'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Pengguna' : 'Tambah Pengguna'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Lengkap <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Contoh: Budi Santoso" value={form.name} onChange={(e) => setForm({ ...form, name: maskInputProfanity(e.target.value) })} />
          </div>
          <div>
            <label className="label">Email Pengguna <span className="text-red-500">*</span></label>
            <input className="input" type="email" placeholder="budi@pharmastock.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">{editId ? 'Password Baru (kosongkan jika tidak berubah)' : <>Password Baru <span className="text-red-500">*</span></>}</label>
            <input className="input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Hak Akses (Role) <span className="text-red-500">*</span></label>
            <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'STAFF' | 'VIEWER' })}>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
