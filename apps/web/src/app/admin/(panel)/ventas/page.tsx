import { api } from '@/lib/api-client';
import { VentasContent } from './VentasContent';

export default async function VentasPage() {
  let sales: import('@persenso/shared').Sale[];
  let clients: import('@persenso/shared').Client[];
  let products: import('@persenso/shared').ProductAdmin[];

  try {
    [sales, clients, products] = await Promise.all([
      api.sales.list(),
      api.clients.list(),
      api.products.list(),
    ]);
  } catch {
    sales = [];
    clients = [];
    products = [];
  }

  return <VentasContent sales={sales} clients={clients} products={products} />;
}
