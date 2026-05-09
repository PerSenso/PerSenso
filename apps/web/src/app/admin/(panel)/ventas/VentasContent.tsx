'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Sale, Client, ProductAdmin } from '@persenso/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { NewSaleDialog } from './NewSaleDialog';
import { NotaCell } from '@/components/admin/NotaCell';

interface VentasContentProps {
  sales: Sale[];
  clients: Client[];
  products: ProductAdmin[];
}

type StatusFilter = 'all' | 'pagada' | 'parcial' | 'pendiente';

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function getSaleStatus(sale: Sale): StatusFilter {
  const paid = (sale.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(sale.total);
  if (paid >= total && total > 0) return 'pagada';
  if (paid > 0) return 'parcial';
  return 'pendiente';
}

const STATUS_STYLE = {
  pagada:    { bg: 'rgba(76,175,125,0.15)',  color: 'var(--ps-green)', label: 'Pagada' },
  parcial:   { bg: 'rgba(201,168,76,0.15)',   color: 'var(--ps-gold)',  label: 'Parcial' },
  pendiente: { bg: 'rgba(224,92,92,0.15)',    color: 'var(--ps-red)',   label: 'Pendiente' },
} as const;

function getStatusBadge(sale: Sale) {
  const status = getSaleStatus(sale);
  if (status === 'all') return null;
  const cfg = STATUS_STYLE[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'pagada',    label: 'Pagadas' },
  { value: 'parcial',   label: 'Parciales' },
  { value: 'pendiente', label: 'Pendientes' },
];

const chipActiveStyle = (value: StatusFilter): React.CSSProperties => ({
  pagada:    { background: 'rgba(76,175,125,0.18)',  color: 'var(--ps-green)' },
  parcial:   { background: 'rgba(201,168,76,0.18)',   color: 'var(--ps-gold)' },
  pendiente: { background: 'rgba(224,92,92,0.18)',    color: 'var(--ps-red)' },
  all:       { background: 'rgba(201,168,76,0.12)',   color: 'var(--ps-gold)' },
})[value];

export function VentasContent({ sales, clients, products }: VentasContentProps) {
  const [showNewSale, setShowNewSale] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total), 0);

  const filterFn = statusFilter === 'all'
    ? undefined
    : (s: Sale) => getSaleStatus(s) === statusFilter;

  return (
    <>
      <AdminPageHeader
        title="Ventas"
        subtitle={`${sales.length} ventas · ${formatCurrency(totalRevenue)} total`}
        actions={
          <button onClick={() => setShowNewSale(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nueva Venta
          </button>
        }
      />

      {/* Chips de estado */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
          Estado:
        </span>
        {STATUS_CHIPS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={statusFilter === value
              ? chipActiveStyle(value)
              : { background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <AdminDataTable
        data={sales}
        keyExtractor={(s) => s.id}
        emptyMessage="No hay ventas registradas"
        searchable
        searchPlaceholder="Buscar por cliente o producto…"
        searchKeys={['client.name', 'product.name']}
        filterFn={filterFn}
        columns={[
          {
            key: 'date', header: 'Fecha', sortable: true,
            render: (s) => new Date(s.date).toLocaleDateString('es-VE'),
          },
          {
            key: 'clientId', header: 'Cliente',
            render: (s) => s.client?.name || 'Desconocido',
          },
          {
            key: 'productId', header: 'Producto',
            render: (s) => s.product?.name || 'Desconocido',
          },
          {
            key: 'total', header: 'Total', sortable: true, align: 'right',
            render: (s) => (
              <span style={{ color: 'var(--ps-gold)' }} className="font-semibold tabular-nums">
                {formatCurrency(Number(s.total))}
              </span>
            ),
          },
          {
            key: 'status', header: 'Estado', align: 'center',
            render: (s) => getStatusBadge(s),
          },
          {
            key: 'notes', header: 'Notas',
            render: (s) => <NotaCell text={s.notes} />,
          },
        ]}
      />

      {showNewSale && (
        <NewSaleDialog clients={clients} products={products} onClose={() => setShowNewSale(false)} />
      )}
    </>
  );
}
