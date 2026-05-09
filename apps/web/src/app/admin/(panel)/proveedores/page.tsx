import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { ProveedoresContent } from './ProveedoresContent';

export default async function ProveedoresPage() {
  try {
    const [suppliers, orders] = await Promise.all([
      api.suppliers.list(),
      api.orders.list(),
    ]);
    return <ProveedoresContent suppliers={suppliers} orders={orders} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <ProveedoresContent suppliers={[]} orders={[]} />;
  }
}
