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
} from 'lucide-react';
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

interface KPI {
  total_products: number;
  total_categories: number;
  total_stock_units: number;
  low_stock_products_count: number;
  expiring_batches_count: number;
  expired_batches_count: number;
}

interface ChartDay {
  date: string;
  stock_in: number;
  stock_out: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reference_no: string | null;
  created_at: string;
  product_name: string;
  product_sku: string;
  batch_number: string;
  user_name: string;
}

interface DashboardData {
  kpi: KPI;
  chart_data_7_days: ChartDay[];
  recent_movements: Movement[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card card-body">
              <div className="skeleton h-4 w-24 mb-3" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="card card-body">
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      label: 'Total Produk',
      value: data.kpi.total_products,
      icon: Package,
      color: 'bg-primary-100 text-primary-700',
    },
    {
      label: 'Kategori',
      value: data.kpi.total_categories,
      icon: Layers,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Total Unit Stok',
      value: data.kpi.total_stock_units.toLocaleString('id-ID'),
      icon: Archive,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Stok Menipis',
      value: data.kpi.low_stock_products_count,
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-700',
      alert: data.kpi.low_stock_products_count > 0,
    },
    {
      label: 'Mendekati Expired',
      value: data.kpi.expiring_batches_count,
      icon: Activity,
      color: 'bg-orange-100 text-orange-700',
      alert: data.kpi.expiring_batches_count > 0,
    },
    {
      label: 'Sudah Expired',
      value: data.kpi.expired_batches_count,
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
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
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Selamat datang, <span className="font-medium text-neutral-700">{user?.name}</span>
          </p>
        </div>
        <span className="badge-info">{user?.role}</span>
      </div>

      {/* Content */}
      <div className="page-content">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {kpiCards.map((card) => (
            <div key={card.label} className={`kpi-card ${card.alert ? 'ring-2 ring-amber-300' : ''}`}>
              <div className={`kpi-icon ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="kpi-value">{card.value}</p>
                <p className="kpi-label">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 card">
            <div className="card-header">Tren Stok 7 Hari Terakhir</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e5e5',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="stock_in" name="Stok Masuk" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stock_out" name="Stok Keluar" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Movements */}
          <div className="card">
            <div className="card-header">Aktivitas Terbaru</div>
            <div className="divide-y divide-neutral-100">
              {data.recent_movements.length === 0 ? (
                <div className="empty-state py-8">
                  <Activity className="empty-state-icon" />
                  <p className="empty-state-title">Belum ada aktivitas</p>
                </div>
              ) : (
                data.recent_movements.map((m) => (
                  <div key={m.id} className="px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          m.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {m.type === 'IN' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{m.product_name}</p>
                        <p className="text-[11px] text-neutral-400">
                          {m.batch_number} · {m.user_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            m.type === 'IN' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {new Date(m.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
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
