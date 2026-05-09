import { api } from '@/lib/api-client';
import { InventarioContent } from './InventarioContent';

export default async function InventarioPage() {
  let products: import('@persenso/shared').ProductAdmin[];

  try {
    products = await api.products.list();
  } catch {
    products = [];
  }

  return <InventarioContent products={products} />;
}
