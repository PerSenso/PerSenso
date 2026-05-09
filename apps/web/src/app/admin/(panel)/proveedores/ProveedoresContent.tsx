'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Supplier, Order } from '@persenso/shared';
import { Plus, Truck, Package } from 'lucide-react';
import { NotaCell } from '@/components/admin/NotaCell';
import { useState } from 'react';
import { NewProveedorDialog } from './NewProveedorDialog';

interface ProveedoresContentProps {
  suppliers: Supplier[];
  orders: Order[];
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function ProveedoresContent({ suppliers, orders }: ProveedoresContentProps) {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [showNew, setShowNew] = useState(false);

  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  return (
    <>
      <AdminPageHeader
        title="Proveedores & Pedidos"
        subtitle={`${suppliers.length} proveedores · ${orders.length} pedidos`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            {activeTab === 'suppliers' ? 'Nuevo Proveedor' : 'Nuevo Pedido'}
          </button>
        }
      />
      {showNew && activeTab === 'suppliers' && (
        <NewProveedorDialog onClose={() => setShowNew(false)} />
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--ps-surface)' }}>
        <button onClick={() => setActiveTab('suppliers')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
          style={{
            background: activeTab === 'suppliers' ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: activeTab === 'suppliers' ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
          }}>
          <Truck className="w-4 h-4" />
          Proveedores
        </button>
        <button onClick={() => setActiveTab('orders')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
          style={{
            background: activeTab === 'orders' ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: activeTab === 'orders' ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
          }}>
          <Package className="w-4 h-4" />
          Pedidos
        </button>
      </div>

      {activeTab === 'suppliers' ? (
        <AdminDataTable
          data={suppliers}
          keyExtractor={(s) => s.id}
          emptyMessage="No hay proveedores registrados"
          searchable
          searchPlaceholder="Buscar por nombre o teléfono…"
          searchKeys={['name', 'phone', 'notes']}
          columns={[
            {
              key: 'name', header: 'Nombre', sortable: true,
              render: (s) => (
                <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{s.name}</span>
              ),
            },
            { key: 'phone', header: 'Teléfono', render: (s) => s.phone || '—' },
            {
              key: 'notes', header: 'Notas',
              render: (s) => <NotaCell text={s.notes} />,
            },
            {
              key: 'createdAt', header: 'Registro', sortable: true,
              render: (s) => new Date(s.createdAt).toLocaleDateString('es-VE'),
            },
          ]}
        />
      ) : (
        <AdminDataTable
          data={orders}
          keyExtractor={(o) => o.id}
          emptyMessage="No hay pedidos registrados"
          searchable
          searchPlaceholder="Buscar pedido…"
          searchKeys={['notes']}
          columns={[
            {
              key: 'date', header: 'Fecha', sortable: true,
              render: (o) => new Date(o.date).toLocaleDateString('es-VE'),
            },
            {
              key: 'supplierId', header: 'Proveedor',
              render: (o) => (o.supplierId ? supplierMap.get(o.supplierId) : '—') || 'Desconocido',
            },
            {
              key: 'restocks', header: 'Items', align: 'center',
              render: (o) => (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--ps-gold)' }}>
                  {o.restocks?.length || 0}
                </span>
              ),
            },
            {
              key: 'shippingCost', header: 'Envío', align: 'right',
              render: (o) => (
                <span className="tabular-nums">{formatCurrency(Number(o.shippingCost))}</span>
              ),
            },
            {
              key: 'notes', header: 'Notas',
              render: (o) => <NotaCell text={o.notes} />,
            },
          ]}
        />
      )}
    </>
  );
}
