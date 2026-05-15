'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayoutShell({ children, role }: { children: React.ReactNode; role?: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--ps-bg)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} role={role} />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header bar */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 md:hidden"
          style={{ background: 'var(--ps-bg)', borderBottom: '1px solid var(--ps-border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-base font-semibold" style={{ color: 'var(--ps-gold)' }}>
            PerSenso
          </span>
        </div>

        <div className="p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
