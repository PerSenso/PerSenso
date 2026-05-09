import { api } from '@/lib/api-client';
import { ClientesContent } from './ClientesContent';

export default async function ClientesPage() {
  let clients: import('@persenso/shared').Client[];

  try {
    clients = await api.clients.list();
  } catch {
    clients = [];
  }

  return <ClientesContent clients={clients} />;
}
