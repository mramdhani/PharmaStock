'use client';

import { useEffect, useState, useCallback } from 'react';
import { ScrollText, TrendingUp, TrendingDown } from 'lucide-react';
import { stockApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

interface Movement {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  batch: {
    batch_number: string;
    product: { name: string; sku: string };
  };
  user: { name: string };
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [typeFilter, setTypeFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 15 };
      if (typeFilter) params.type = typeFilter;
      const res = await stockApi.getMovements(params);
      setMovements(res.data.data.items);
      setMeta(res.data.data.meta);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Riwayat Mutasi Stok</h1>
      </div>

      <div className="page-content">
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['', 'IN', 'OUT'].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`btn-sm rounded-full ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t === '' ? 'Semua' : t === 'IN' ? 'Stok Masuk' : 'Stok Keluar'}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Produk</th>
                  <th>Batch</th>
                  <th className="text-right">Qty</th>
                  <th>Referensi</th>
                  <th>Operator</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j}><div className="skeleton h-4 w-16" /></td>
                      ))}
                    </tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="!py-4 !px-0">
                      <EmptyState
                        icon={ScrollText}
                        title="Belum ada riwayat"
                        description="Buku besar mutasi stok masih kosong. Riwayat akan otomatis tercatat saat stok masuk atau keluar."
                      />
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${m.type === 'IN' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {m.type === 'IN' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {m.type === 'IN' ? 'Masuk' : 'Keluar'}
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-neutral-900">{m.batch?.product?.name}</p>
                        <p className="text-xs text-neutral-400">{m.batch?.product?.sku}</p>
                      </td>
                      <td><code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded font-mono">{m.batch?.batch_number}</code></td>
                      <td className={`text-right font-semibold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="text-neutral-500">{m.reference_no || '—'}</td>
                      <td className="text-neutral-600">{m.user?.name}</td>
                      <td className="text-neutral-500 text-xs">
                        {new Date(m.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <p className="text-sm text-neutral-500">{meta.total} transaksi</p>
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
    </>
  );
}
