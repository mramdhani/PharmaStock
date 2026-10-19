'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookMarked,
  Building2,
  Calendar,
  Globe,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Trash2,
  User,
  Sparkles,
} from 'lucide-react';
import { guestbookApi, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import EmptyState from '@/components/EmptyState';

interface GuestbookEntry {
  id: string;
  name: string;
  organization: string | null;
  note: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function GuestbookPage() {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await guestbookApi.getAll();
      const data = res.data.data;
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memuat daftar buku tamu'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchEntries();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, fetchEntries]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan salam dari "${name}"?`)) return;

    setDeletingId(id);
    try {
      await guestbookApi.delete(id);
      toast.success(`Catatan dari ${name} berhasil dihapus`);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus data buku tamu'));
    } finally {
      setDeletingId(null);
    }
  };

  // Jika bukan Superadmin
  if (!isSuperAdmin && !loading) {
    return (
      <div className="page-content">
        <div className="card p-8 text-center max-w-lg mx-auto mt-12 border-red-200">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#c41230] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Akses Khusus Superadmin</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Halaman Buku Tamu ini privat dan hanya dapat diakses oleh akun <strong>Superadmin</strong> (tuan.ramdhani@gmail.com).
            Anda saat ini masuk dengan role <span className="badge-info text-xs">{user?.role}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">Buku Tamu Rekruter & Pengunjung</h1>
            <span className="badge-danger text-[10px] font-bold">Khusus Superadmin</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Catatan perkenalan dari recruiter, interviewer, dan pengunjung yang telah mencoba live showcase PharmaStock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="btn-secondary"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* KPI Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c41230] flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Salam Masuk</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{total}</p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perusahaan / Institusi</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {entries.filter((e) => e.organization && e.organization.trim() !== '').length}
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Database</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">PostgreSQL Aktif</p>
            </div>
          </div>
        </div>

        {/* Table / List */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-64" />
                  </div>
                  <div className="skeleton h-8 w-20" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BookMarked}
                title="Belum Ada Catatan Buku Tamu"
                description="Ketika ada recruiter atau pengunjung yang memperkenalkan diri saat login, riwayatnya akan muncul di sini secara otomatis."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pengunjung</th>
                    <th>Perusahaan / Instansi</th>
                    <th>Pesan / Salam</th>
                    <th>Waktu Berkunjung</th>
                    <th>Perangkat & IP</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#c41230] flex items-center justify-center shrink-0 font-bold text-xs">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{item.name}</span>
                        </div>
                      </td>

                      {/* Organization */}
                      <td>
                        {item.organization ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {item.organization}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tidak dicantumkan</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="max-w-xs">
                        {item.note ? (
                          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed italic">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-slate-500">
                            {new Date(item.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </span>
                        </div>
                      </td>

                      {/* Device & IP */}
                      <td className="text-[11px] text-slate-500 max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-600">{item.ip_address || '127.0.0.1'}</span>
                        </div>
                        {item.user_agent && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5" title={item.user_agent}>
                            {item.user_agent}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus salam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
