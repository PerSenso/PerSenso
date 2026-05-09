import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { ClientesContent } from './ClientesContent';

export default async function ClientesPage() {
  try {
    const clients = await api.clients.listWithDebt();
    return <ClientesContent clients={clients} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <ClientesContent clients={[]} />;
  }
}
