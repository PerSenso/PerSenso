'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  Receipt,
  Truck,
  BarChart3,
  GitBranch,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { logout } from '@/app/admin/login/actions';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/admin/inventario', label: 'Inventario', icon: Package },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/saldo', label: 'Saldo / Caja', icon: Wallet },
  { href: '/admin/gastos', label: 'Gastos', icon: Receipt },
  { href: '/admin/proveedores', label: 'Proveedores', icon: Truck },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/trazabilidad', label: 'Trazabilidad', icon: GitBranch },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.nav
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="sidebar-persenso flex flex-col h-screen sticky top-0 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between min-h-[64px]">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <span
                className="font-display text-xl font-semibold whitespace-nowrap"
                style={{ color: 'var(--ps-gold)' }}
              >
                PerSenso
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ color: 'var(--ps-text-muted)' }}
              >
                Admin
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: 'var(--ps-surface)',
            color: 'var(--ps-text-muted)',
          }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Gold divider */}
      <div className="mx-4 gold-line" />

      {/* Nav links */}
      <div className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group"
              style={{
                color: isActive ? 'var(--ps-gold)' : 'var(--ps-text-soft)',
                background: isActive ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'var(--ps-gold)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-2 space-y-1 border-t" style={{ borderColor: 'var(--ps-border)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 w-full"
          style={{ color: 'var(--ps-text-muted)' }}
          title={collapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] flex-shrink-0" />
          ) : (
            <Moon className="w-[18px] h-[18px] flex-shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 w-full hover:text-[var(--ps-red)]"
            style={{ color: 'var(--ps-text-muted)' }}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>
      </div>
    </motion.nav>
  );
}
