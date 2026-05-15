import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { api, ApiError } from '@/lib/api-client';
import { UsuariosContent } from './UsuariosContent';

function decodeJwt(token: string): { role?: string; sub?: string } {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  } catch {
    return {};
  }
}

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) redirect('/admin/login');

  const payload = decodeJwt(token);
  if (payload.role !== 'OWNER') redirect('/admin/dashboard');

  try {
    const users = await api.users.list();
    return <UsuariosContent users={users} currentUserId={payload.sub ?? ''} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    if (e instanceof ApiError && e.status === 403) redirect('/admin/dashboard');
    return <UsuariosContent users={[]} currentUserId={payload.sub ?? ''} />;
  }
}
