'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cross, Eye, EyeOff, Shield, UserCog, BookOpen } from 'lucide-react';
import { authApi } from '@/lib/api';

const demoAccounts = [
  { label: 'Admin', email: 'admin@pharmastock.com', password: 'PharmaStock123!', icon: Shield, desc: 'Akses penuh' },
  { label: 'Staff', email: 'staff@pharmastock.com', password: 'PharmaStock123!', icon: UserCog, desc: 'Transaksi harian' },
  { label: 'Viewer', email: 'viewer@pharmastock.com', password: 'PharmaStock123!', icon: BookOpen, desc: 'Read-only' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const data = res.data.data;
      localStorage.setItem('pharmastock_token', data.access_token);
      localStorage.setItem('pharmastock_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(account.email, account.password);
      const data = res.data.data;
      localStorage.setItem('pharmastock_token', data.access_token);
      localStorage.setItem('pharmastock_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Login demo gagal. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Decorative patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-white/3" />
      </div>

      <div className="login-card relative">
        {/* Logo */}
        <div className="login-logo">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4 shadow-lg">
            <Cross className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">PharmaStock</h2>
          <p className="text-sm text-neutral-500 mt-1">Pharmaceutical Inventory Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Quick Login Demo */}
        <div className="login-divider">
          <span className="text-xs text-neutral-400 whitespace-nowrap">Demo Login</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.label}
              onClick={() => quickLogin(acc)}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
            >
              <acc.icon className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
              <span className="text-xs font-semibold text-neutral-700 group-hover:text-primary-700">{acc.label}</span>
              <span className="text-[10px] text-neutral-400">{acc.desc}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-neutral-400">
          Sistem manajemen inventaris farmasi enterprise-grade
        </p>
      </div>
    </div>
  );
}
