'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Layers,
  Archive,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface DashboardData {
  kpi: {
    total_products: number;
    total_categories: number;
    total_stock_units: number;
    low_stock_products_count: number;
    expiring_batches_count: number;
    expired_batches_count: number;
  };
  chart_data_7_days: {
    date: string;
    stock_in: number;
    stock_out: number;
  }[];
  recent_movements: {
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    batch_number: string;
    product_name: string;
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [visitor, setVisitor] = useState<{ name: string; org?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pharmastock_guest_visitor');
      if (saved) {
        setVisitor(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-28 mb-3" />
              <div className="skeleton h-8 w-20 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="card p-6">
          <div className="skeleton h-72 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      label: 'Total Katalog Obat',
      value: data.kpi.total_products,
      subtext: 'Obat terdaftar aktif',
      icon: Package,
      badgeText: 'Katalog',
      badgeClass: 'badge-neutral',
      iconBg: 'bg-red-50 text-[#c41230]',
      alert: false,
    },
    {
      label: 'Kategori Farmasi',
      value: data.kpi.total_categories,
      subtext: 'Klasifikasi terapi',
      icon: Layers,
      badgeText: 'Kategori',
      badgeClass: 'badge-neutral',
      iconBg: 'bg-blue-50 text-blue-600',
      alert: false,
    },
    {
      label: 'Total Unit Stok',
      value: data.kpi.total_stock_units.toLocaleString('id-ID'),
      subtext: 'Unit di seluruh batch',
      icon: Archive,
      badgeText: 'Tersedia',
      badgeClass: 'badge-success',
      iconBg: 'bg-emerald-50 text-emerald-600',
      alert: false,
    },
    {
      label: 'Stok Menipis',
      value: data.kpi.low_stock_products_count,
      subtext: data.kpi.low_stock_products_count > 0 ? 'Perlu pengadaan segera' : 'Stok dalam batas aman',
      icon: AlertTriangle,
      badgeText: data.kpi.low_stock_products_count > 0 ? 'Perlu Restock' : 'Aman',
      badgeClass: data.kpi.low_stock_products_count > 0 ? 'badge-warning' : 'badge-success',
      iconBg: data.kpi.low_stock_products_count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600',
      alert: data.kpi.low_stock_products_count > 0,
    },
    {
      label: 'Mendekati Expired',
      value: data.kpi.expiring_batches_count,
      subtext: 'Kadaluarsa dalam < 30 hari',
      icon: Clock,
      badgeText: data.kpi.expiring_batches_count > 0 ? 'Perhatian FEFO' : 'Tidak Ada',
      badgeClass: data.kpi.expiring_batches_count > 0 ? 'badge-warning' : 'badge-success',
      iconBg: data.kpi.expiring_batches_count > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600',
      alert: data.kpi.expiring_batches_count > 0,
    },
    {
      label: 'Batch Expired',
      value: data.kpi.expired_batches_count,
      subtext: data.kpi.expired_batches_count > 0 ? 'Karantina & musnahkan' : 'Semua batch aman',
      icon: XCircle,
      badgeText: data.kpi.expired_batches_count > 0 ? 'Harus Ditarik' : 'Nol Batch',
      badgeClass: data.kpi.expired_batches_count > 0 ? 'badge-danger' : 'badge-success',
      iconBg: data.kpi.expired_batches_count > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600',
      alert: data.kpi.expired_batches_count > 0,
    },
  ];

  const chartData = data.chart_data_7_days.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
  }));

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Operasional</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sistem Manajemen Inventaris Farmasi Enterprise · Masuk sebagai <span className="font-semibold text-slate-800">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-info">{user?.role}</span>
        </div>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* Recruiter / Visitor Welcome Banner */}
        {showBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 via-white to-red-50/40 border border-red-200/70 shadow-sm relative flex items-start justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100/80 text-[#c41230] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {visitor?.name
                      ? `Selamat Datang, ${visitor.name}${visitor.org ? ` (${visitor.org})` : ''}! 👋`
                      : 'Live Enterprise Showcase — PharmaStock'}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-[#c41230]">
                    Portfolio
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {visitor?.name
                    ? `Terima kasih sudah berkunjung, ${visitor.name}! Showcase ini dibangun oleh Muhammad Ramdani menggunakan Next.js, NestJS, dan PostgreSQL. Silakan eksplorasi fitur stok, batch FEFO, atau uji dokumentasi API interaktif.`
                    : `Halo Rekruter & Pengunjung! Aplikasi ini dibangun oleh Muhammad Ramdani menggunakan Next.js, NestJS, PostgreSQL, dan dideploy via Docker di Linux VPS. Silakan eksplorasi fitur stok, batch, atau uji dokumentasi API interaktif.`}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <a
                    href="https://pharmastock.muhramdani.com/api/docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#c41230] hover:underline flex items-center gap-1"
                  >
                    📘 Dokumentasi Swagger API &rarr;
                  </a>
                  <span className="text-slate-300">•</span>
                  <a
                    href="https://muhramdani.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    🌐 Kunjungi Portofolio Utama
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 transition-colors"
              title="Tutup sapaan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`kpi-card ${
                card.alert
                  ? 'border-amber-200 bg-amber-50/20'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className={card.badgeClass}>{card.badgeText}</span>
              </div>

              <div>
                <p className="kpi-value">{card.value}</p>
                <p className="kpi-label mt-0.5">{card.label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{card.subtext}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 card">
            <div className="card-header">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tren Mutasi Stok 7 Hari Terakhir</h3>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Monitoring pergerakan keluar-masuk unit farmasi</p>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.07)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="stock_in" name="Stok Masuk" fill="#c41230" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stock_out" name="Stok Keluar" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Movements */}
          <div className="card flex flex-col">
            <div className="card-header">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Mutasi Terbaru</h3>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Riwayat transaksi stok terakhir</p>
              </div>
              <Link href="/dashboard/movements" className="text-xs font-semibold text-[#c41230] hover:underline flex items-center gap-1">
                Buku Besar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
              {data.recent_movements.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada mutasi stok</p>
                  <p className="text-[11px] text-slate-400 mt-1">Lakukan stok masuk untuk memulai pencatatan.</p>
                </div>
              ) : (
                data.recent_movements.map((m) => (
                  <div key={m.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          m.type === 'IN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {m.type === 'IN' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{m.product_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Batch: <span className="font-medium text-slate-600">{m.batch_number}</span> · {new Date(m.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
