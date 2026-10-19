'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cross, Eye, EyeOff, Shield, UserCog, BookOpen, Clock, AlertTriangle, ShieldAlert, ExternalLink } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  // Rate Limiting & Attempt Tracking State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [initialCountdown, setInitialCountdown] = useState<number>(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setIsThrottled(false);
      setCountdown(null);
      setErrorMessage(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleErrorResponse = (err: unknown) => {
    const axiosErr = err as {
      response?: {
        status?: number;
        headers?: Record<string, string>;
        data?: { message?: string; statusCode?: number };
      };
    };

    const status = axiosErr.response?.status;
    const newAttemptCount = failedAttempts + 1;
    setFailedAttempts(newAttemptCount);

    // Rate Limit 429
    if (status === 429) {
      const retryHeader =
        axiosErr.response?.headers?.['retry-after'] ||
        axiosErr.response?.headers?.['Retry-After'] ||
        axiosErr.response?.headers?.['x-ratelimit-reset'];

      let waitSeconds = 60;
      if (retryHeader) {
        const parsed = parseInt(retryHeader, 10);
        if (!isNaN(parsed) && parsed > 0) {
          waitSeconds = parsed;
        }
      }

      setIsThrottled(true);
      setInitialCountdown(waitSeconds);
      setCountdown(waitSeconds);
      setErrorMessage(
        axiosErr.response?.data?.message ||
          'Batas percobaan login terlampaui. Akses dibatasi sementara demi keamanan akun.'
      );
      return;
    }

    // 401 Unauthorized / Invalid Credentials
    if (status === 401) {
      setErrorMessage(`Email atau password salah (Percobaan gagal ke-${newAttemptCount}).`);
      return;
    }

    // Backend Unreachable / Network Error
    if (!axiosErr.response) {
      setErrorMessage('Koneksi ke backend server gagal. Pastikan server NestJS berjalan di port 3001.');
      return;
    }

    // Generic API Error
    setErrorMessage(axiosErr.response?.data?.message || 'Login gagal. Silakan coba lagi.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isThrottled) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const data = res.data.data;
      localStorage.setItem('pharmastock_token', data.access_token);
      localStorage.setItem('pharmastock_user', JSON.stringify(data.user));
      setFailedAttempts(0);
      router.push('/dashboard');
    } catch (err: unknown) {
      handleErrorResponse(err);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (account: typeof demoAccounts[0]) => {
    if (isThrottled) return;

    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await authApi.login(account.email, account.password);
      const data = res.data.data;
      localStorage.setItem('pharmastock_token', data.access_token);
      localStorage.setItem('pharmastock_user', JSON.stringify(data.user));
      setFailedAttempts(0);
      router.push('/dashboard');
    } catch (err: unknown) {
      handleErrorResponse(err);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = countdown && initialCountdown
    ? Math.max(0, Math.min(100, (countdown / initialCountdown) * 100))
    : 0;

  return (
    <div className="login-wrapper">
      {/* Decorative patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-white/3" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center z-10">
        {/* Floating Glassmorphic Greeting Pill di Luar Card */}
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white shadow-lg transition-all text-xs">
          <span className="text-sm">👋</span>
          <span className="font-medium">
            Live Showcase by <strong className="font-semibold text-white">Muhammad Ramdani</strong>
          </span>
          <span className="text-white/40">•</span>
          <a
            href="https://muhramdani.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-red-100 hover:text-white underline underline-offset-2 transition-colors"
          >
            Portfolio <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="login-card relative w-full">
          {/* Logo */}
          <div className="login-logo mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c41230] to-[#8e0c23] flex items-center justify-center mb-4 shadow-lg shadow-red-900/20">
              <Cross className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">PharmaStock</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Pharmaceutical Inventory Management</p>
          </div>

          {/* Rate Limiting Active Banner */}
          {isThrottled && countdown !== null && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-red-900">Rate Limit Terlampaui</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-200 text-red-800">
                      Gagal {failedAttempts}x
                    </span>
                  </div>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Terlalu banyak percobaan dalam waktu singkat. Sistem keamanan membatasi login sementara.
                  </p>

                  {/* Live Countdown & Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-red-200/60">
                    <div className="flex items-center justify-between text-xs font-semibold text-red-800 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600 animate-spin" />
                        Silakan tunggu sebelum mencoba lagi
                      </span>
                      <span className="font-mono text-sm font-bold text-red-900">
                        {countdown}s
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-red-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Error Banner (when not throttled) */}
          {!isThrottled && errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold">{errorMessage}</p>
                {failedAttempts > 0 && (
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    Total percobaan gagal: <strong>{failedAttempts}</strong> kali
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="label">Email Pengguna</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="nama@pharmastock.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isThrottled || loading}
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="label">Kata Sandi</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isThrottled || loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isThrottled}
            className="btn-primary w-full py-2.5"
          >
            {isThrottled ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Terkunci ({countdown}s)
              </span>
            ) : loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>

        {/* Quick Login Demo */}
        <div className="login-divider">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            1-Klik Demo Login
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.label}
              onClick={() => quickLogin(acc)}
              disabled={loading || isThrottled}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 group ${
                isThrottled
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                  : 'border-slate-200 hover:border-red-300 hover:bg-red-50/50 bg-white shadow-sm hover:shadow'
              }`}
            >
              <acc.icon className={`w-5 h-5 transition-colors ${isThrottled ? 'text-slate-400' : 'text-slate-500 group-hover:text-[#c41230]'}`} />
              <span className={`text-xs font-semibold ${isThrottled ? 'text-slate-400' : 'text-slate-800 group-hover:text-[#c41230]'}`}>{acc.label}</span>
              <span className="text-[10px] text-slate-400">{acc.desc}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Sistem manajemen inventaris farmasi enterprise-grade
        </p>
      </div>
    </div>
    </div>
  );
}
