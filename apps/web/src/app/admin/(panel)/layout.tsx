import { cookies } from 'next/headers';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Admin — PerSenso',
  robots: { index: false, follow: false },
};

function decodeJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const role = token ? decodeJwtRole(token) : null;

  return (
    <>
      <AdminLayoutShell role={role}>{children}</AdminLayoutShell>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
