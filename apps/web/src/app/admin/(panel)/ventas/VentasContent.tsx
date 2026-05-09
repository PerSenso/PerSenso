'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Sale, Client, ProductAdmin } from '@persenso/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { NewSaleDialog } from './NewSaleDialog';

interface VentasContentProps {
  sales: Sale[];
  clients: Client[];
  products: ProductAdmin[];
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function getStatusBadge() {
  // Simple status based on presence of notes or sale amount
  return (
    <span className="badge-paid text-xs px-2 py-0.5 rounded-full font-medium">
      Registrada
    </span>
  );
}

export function VentasContent({ sales, clients, products }: VentasContentProps) {
  const [showNewSale, setShowNewSale] = useState(false);

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total), 0);

  return (
    <>
      <AdminPageHeader
        title="Ventas"
        subtitle={`${sales.length} ventas · ${formatCurrency(totalRevenue)} total`}
        actions={
          <button
            onClick={() => setShowNewSale(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Venta
          </button>
        }
      />

      <AdminDataTable
        data={sales}
        keyExtractor={(s) => s.id}
        emptyMessage="No hay ventas registradas"
        columns={[
          {
            key: 'date',
            header: 'Fecha',
            sortable: true,
            render: (s) => new Date(s.date).toLocaleDateString('es-VE'),
          },
          {
            key: 'clientId',
            header: 'Cliente',
            render: (s) => s.client?.name || 'Desconocido',
          },
          {
            key: 'productId',
            header: 'Producto',
            render: (s) => s.product?.name || 'Desconocido',
          },
          {
            key: 'total',
            header: 'Total',
            sortable: true,
            align: 'right',
            render: (s) => (
              <span style={{ color: 'var(--ps-gold)' }} className="font-semibold">
                {formatCurrency(Number(s.total))}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            align: 'center',
            render: () => getStatusBadge(),
          },
          {
            key: 'notes',
            header: 'Notas',
            render: (s) => (
              <span className="text-xs truncate max-w-[200px] block" style={{ color: 'var(--ps-text-muted)' }}>
                {s.notes || '—'}
              </span>
            ),
          },
        ]}
      />

      {showNewSale && (
        <NewSaleDialog
          clients={clients}
          products={products}
          onClose={() => setShowNewSale(false)}
        />
      )}
    </>
  );
}
