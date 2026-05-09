import { api } from '@/lib/api-client';
import { ProveedoresContent } from './ProveedoresContent';

export default async function ProveedoresPage() {
  let suppliers: import('@persenso/shared').Supplier[];
  let orders: import('@persenso/shared').Order[];

  try {
    [suppliers, orders] = await Promise.all([
      api.suppliers.list(),
      api.orders.list(),
    ]);
  } catch {
    suppliers = [];
    orders = [];
  }

  return <ProveedoresContent suppliers={suppliers} orders={orders} />;
}
