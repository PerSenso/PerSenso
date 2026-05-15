import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { api, ApiError } from '@/lib/api-client';
import { UsuariosContent } from './UsuariosContent';

function decodeJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) redirect('/admin/login');

  const role = decodeJwtRole(token);
  if (role !== 'OWNER') redirect('/admin/dashboard');

  try {
    const users = await api.users.list();
    return <UsuariosContent users={users} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    if (e instanceof ApiError && e.status === 403) redirect('/admin/dashboard');
    return <UsuariosContent users={[]} />;
  }
}
