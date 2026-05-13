'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { ProductAdmin } from '@persenso/shared';
import { Plus, AlertTriangle, Pencil } from 'lucide-react';
import { NewProductoDialog } from './NewProductoDialog';
import { EditProductoDialog } from './EditProductoDialog';
import { ProductDetailModal } from './ProductDetailModal';
import { IdBadge } from '@/components/admin/IdBadge';

interface InventarioContentProps {
  products: ProductAdmin[];
}

type GenderFilter = 'all' | 'HOMBRE' | 'MUJER' | 'UNISEX';

const GENDER_CHIPS: { value: GenderFilter; label: string }[] = [
  { value: 'all',    label: 'Todos' },
  { value: 'HOMBRE', label: '♂ Hombre' },
  { value: 'MUJER',  label: '♀ Mujer' },
  { value: 'UNISEX', label: '⚥ Unisex' },
];

export function InventarioContent({ products }: InventarioContentProps) {
  const [showNew, setShowNew] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductAdmin | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [stockCritico, setStockCritico] = useState(false);

  const filterFn = (p: ProductAdmin): boolean => {
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
    if (stockCritico && (p.stock ?? 0) > (p.minStock ?? 2)) return false;
    return true;
  };

  const hasFilter = genderFilter !== 'all' || stockCritico;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= (p.minStock ?? 2)).length;

  return (
    <>
      <AdminPageHeader
        title="Inventario"
        subtitle={`${products.length} productos registrados`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        }
      />
      {showNew && <NewProductoDialog onClose={() => setShowNew(false)} />}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={() => { setEditingProduct(detailProduct); setDetailProduct(null); }}
        />
      )}
      {editingProduct && <EditProductoDialog product={editingProduct} onClose={() => setEditingProduct(null)} />}

      {/* Chips de filtro */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Género */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            Género:
          </span>
          {GENDER_CHIPS.map(({ value, label }) => (
            <button key={value} onClick={() => setGenderFilter(value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={genderFilter === value
                ? { background: 'rgba(201,168,76,0.18)', color: 'var(--ps-gold)' }
                : { background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }
              }>
              {label}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="w-px h-4" style={{ background: 'var(--ps-border)' }} />

        {/* Stock crítico */}
        <button onClick={() => setStockCritico((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
          style={stockCritico
            ? { background: 'rgba(224,92,92,0.18)', color: 'var(--ps-red)' }
            : { background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }
          }>
          <AlertTriangle className="w-3 h-3" />
          Stock crítico ({lowStockCount})
        </button>
      </div>

      <AdminDataTable
        data={products}
        keyExtractor={(p) => p.id}
        emptyMessage="No hay productos registrados"
        searchable
        searchPlaceholder="Buscar por nombre o marca…"
        searchKeys={['name', 'brand']}
        filterFn={hasFilter ? filterFn : undefined}
        onRowClick={(p) => setDetailProduct(p)}
        columns={[
          { key: '_id', header: 'ID', render: (p) => <IdBadge id={p.id} /> },
          {
            key: 'name', header: 'Producto', sortable: true,
            render: (p) => (
              <div>
                <p className="font-medium" style={{ color: 'var(--ps-text)' }}>{p.name}</p>
                {(p.brand || p.concentration) && (
                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    {[p.brand, p.concentration].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'size', header: 'Tamaño',
            render: (p) => p.size || (p.sizeMl ? `${p.sizeMl}ml` : '—'),
          },
          {
            key: 'gender', header: 'Género',
            render: (p) => {
              const icons: Record<string, string> = { HOMBRE: '♂', MUJER: '♀', UNISEX: '⚥' };
              return `${icons[p.gender] || ''} ${p.gender}`;
            },
          },
          {
            key: 'stock', header: 'Stock', sortable: true, align: 'center',
            render: (p) => {
              const stock = p.stock ?? 0;
              const minStock = p.minStock ?? 2;
              const isLow = stock <= minStock;
              return (
                <span className="font-medium tabular-nums"
                  style={{ color: stock === 0 ? 'var(--ps-red)' : isLow ? 'var(--ps-gold)' : 'var(--ps-text)' }}>
                  {stock}
                </span>
              );
            },
          },
          {
            key: 'costPrice', header: 'Costo', sortable: true, align: 'right',
            render: (p) => (
              <span className="tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
                ${Number(p.costPrice).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'salePrice', header: 'Precio Venta', sortable: true, align: 'right',
            render: (p) => (
              <span className="font-semibold tabular-nums" style={{ color: 'var(--ps-gold)' }}>
                ${Number(p.salePrice).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'isPublished', header: 'Visible', align: 'center',
            render: (p) => (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: p.isPublished ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.15)',
                  color: p.isPublished ? 'var(--ps-green)' : 'var(--ps-red)',
                }}>
                {p.isPublished ? 'Sí' : 'No'}
              </span>
            ),
          },
          {
            key: '_actions', header: '',
            render: (p) => (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                title="Editar producto"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
