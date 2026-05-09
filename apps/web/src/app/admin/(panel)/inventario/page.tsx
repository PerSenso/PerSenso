import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { InventarioContent } from './InventarioContent';

export default async function InventarioPage() {
  try {
    const products = await api.products.list();
    return <InventarioContent products={products} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <InventarioContent products={[]} />;
  }
}
