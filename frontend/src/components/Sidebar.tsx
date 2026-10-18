'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  ScrollText,
  Users,
  LogOut,
  Cross,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produk', href: '/dashboard/products', icon: Package },
  { name: 'Kategori', href: '/dashboard/categories', icon: Layers },
  { name: 'Batch', href: '/dashboard/batches', icon: Archive },
  { name: 'Stok Masuk', href: '/dashboard/stock-in', icon: ArrowDownToLine },
  { name: 'Stok Keluar', href: '/dashboard/stock-out', icon: ArrowUpFromLine },
  { name: 'Riwayat', href: '/dashboard/movements', icon: ScrollText },
];

const adminNav = [
  { name: 'Pengguna', href: '/dashboard/users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="w-10 h-10 rounded-xl bg-[#c41230] shadow-sm shadow-red-200 flex items-center justify-center shrink-0">
          <Cross className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">PharmaStock</h1>
          <p className="text-[11px] font-medium text-slate-400">Inventory Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin</p>
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-100 px-4 py-3.5 bg-slate-50/50 mt-auto shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-[#c41230] border border-red-100 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{user?.name}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-200/70 text-slate-600">
              {user?.role}
            </span>
          </div>
          <button 
            onClick={logout} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
            title="Keluar"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
