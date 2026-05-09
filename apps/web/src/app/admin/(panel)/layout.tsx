import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Admin — PerSenso',
  robots: { index: false, follow: false },
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--ps-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
