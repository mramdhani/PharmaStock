'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = ++toastId;
    const defaultTitles: Record<ToastType, string> = {
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      warning: 'Peringatan Validasi',
      info: 'Informasi',
    };

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        title: title || defaultTitles[type],
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastStyles: Record<
    ToastType,
    { border: string; bg: string; icon: React.ReactNode; titleColor: string }
  > = {
    success: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
    },
    error: {
      border: 'border-red-200',
      bg: 'bg-white',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
      titleColor: 'text-red-900',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-white',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-900',
    },
    info: {
      border: 'border-blue-200',
      bg: 'bg-white',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-900',
    },
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (m, t) => addToast('success', m, t),
        error: (m, t) => addToast('error', m, t),
        warning: (m, t) => addToast('warning', m, t),
        info: (m, t) => addToast('info', m, t),
      }}
    >
      {children}
      {/* Toast Container placed at top z-index above all modals */}
      <div className="toast-container" style={{ zIndex: 99999 }}>
        {toasts.map((t) => {
          const style = toastStyles[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border ${style.border} ${style.bg} shadow-xl shadow-slate-900/10 flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-2 fade-in`}
            >
              {style.icon}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-tight ${style.titleColor}`}>
                  {t.title}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 -mr-1"
                title="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
