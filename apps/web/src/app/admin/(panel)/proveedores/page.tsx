import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { ProveedoresContent } from './ProveedoresContent';

export default async function ProveedoresPage() {
  try {
    const [suppliers, products] = await Promise.all([
      api.suppliers.list(),
      api.products.list(),
    ]);
    return <ProveedoresContent suppliers={suppliers} products={products} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <ProveedoresContent suppliers={[]} products={[]} />;
  }
}
