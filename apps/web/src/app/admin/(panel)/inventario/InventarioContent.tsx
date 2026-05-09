'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { ProductAdmin } from '@persenso/shared';
import { Plus } from 'lucide-react';

interface InventarioContentProps {
  products: ProductAdmin[];
}

export function InventarioContent({ products }: InventarioContentProps) {
  return (
    <>
      <AdminPageHeader
        title="Inventario"
        subtitle={`${products.length} productos registrados`}
        actions={
          <button className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        }
      />

      <AdminDataTable
        data={products}
        keyExtractor={(p) => p.id}
        emptyMessage="No hay productos registrados"
        columns={[
          {
            key: 'name',
            header: 'Producto',
            sortable: true,
            render: (p) => (
              <div>
                <p className="font-medium" style={{ color: 'var(--ps-text)' }}>{p.name}</p>
                {p.brand && (
                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{p.brand}</p>
                )}
              </div>
            ),
          },
          {
            key: 'size',
            header: 'Tamaño',
            render: (p) => p.size || (p.sizeMl ? `${p.sizeMl}ml` : '—'),
          },
          {
            key: 'gender',
            header: 'Género',
            render: (p) => {
              const icons: Record<string, string> = { HOMBRE: '♂', MUJER: '♀', UNISEX: '⚥' };
              return `${icons[p.gender] || ''} ${p.gender}`;
            },
          },
          {
            key: 'stock',
            header: 'Stock',
            sortable: true,
            align: 'center',
            render: (p) => {
              const stock = p.stock ?? 0;
              const minStock = p.minStock ?? 2;
              const isLow = stock <= minStock;
              return (
                <span
                  className="font-medium"
                  style={{ color: stock === 0 ? 'var(--ps-red)' : isLow ? 'var(--ps-gold)' : 'var(--ps-text)' }}
                >
                  {stock}
                </span>
              );
            },
          },
          {
            key: 'costPrice',
            header: 'Costo',
            sortable: true,
            align: 'right',
            render: (p) => (
              <span style={{ color: 'var(--ps-text-muted)' }}>
                ${Number(p.costPrice).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'salePrice',
            header: 'Precio Venta',
            sortable: true,
            align: 'right',
            render: (p) => (
              <span style={{ color: 'var(--ps-gold)' }} className="font-semibold">
                ${Number(p.salePrice).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'isPublished',
            header: 'Visible',
            align: 'center',
            render: (p) => (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: p.isPublished ? 'rgba(76, 175, 125, 0.15)' : 'rgba(224, 92, 92, 0.15)',
                  color: p.isPublished ? 'var(--ps-green)' : 'var(--ps-red)',
                }}
              >
                {p.isPublished ? 'Sí' : 'No'}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
