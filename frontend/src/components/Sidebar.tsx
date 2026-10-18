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
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <Cross className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-neutral-900">PharmaStock</h1>
          <p className="text-[11px] text-neutral-400">Inventory Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="px-3 mb-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 mt-6 mb-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Admin</p>
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-neutral-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">{user?.name}</p>
            <p className="text-[11px] text-neutral-400">{user?.role}</p>
          </div>
          <button onClick={logout} className="text-neutral-400 hover:text-red-500 transition-colors" title="Keluar">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
