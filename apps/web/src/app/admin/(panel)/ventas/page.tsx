import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { VentasContent } from './VentasContent';

export default async function VentasPage() {
  try {
    const [sales, clients, products] = await Promise.all([
      api.sales.list(),
      api.clients.list(),
      api.products.list(),
    ]);
    return <VentasContent sales={sales} clients={clients} products={products} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <VentasContent sales={[]} clients={[]} products={[]} />;
  }
}
