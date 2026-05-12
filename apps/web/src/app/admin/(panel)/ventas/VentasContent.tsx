'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Sale, Client, ProductAdmin } from '@persenso/shared';
import { Plus, Pencil, GitBranch, Ban } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NewSaleDialog } from './NewSaleDialog';
import { EditSaleDialog } from './EditSaleDialog';
import { NotaCell } from '@/components/admin/NotaCell';
import { IdBadge } from '@/components/admin/IdBadge';
import { TraceChainModal } from '@/components/admin/TraceChainModal';

interface VentasContentProps {
  sales: Sale[];
  clients: Client[];
  products: ProductAdmin[];
}

type StatusFilter = 'all' | 'pagada' | 'parcial' | 'pendiente' | 'anulada';

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function getSaleStatus(sale: Sale): StatusFilter {
  if (sale.status === 'ANULADA') return 'anulada';
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
  anulada:   { bg: 'rgba(150,150,150,0.15)',  color: 'var(--ps-text-muted)', label: 'Anulada' },
} as const;

function getStatusBadge(sale: Sale) {
  const status = getSaleStatus(sale);
  if (status === 'all') return null;
  const cfg = STATUS_STYLE[status as keyof typeof STATUS_STYLE];
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
  { value: 'anulada',   label: 'Anuladas' },
];

const chipActiveStyle = (value: StatusFilter): React.CSSProperties => ({
  pagada:    { background: 'rgba(76,175,125,0.18)',  color: 'var(--ps-green)' },
  parcial:   { background: 'rgba(201,168,76,0.18)',   color: 'var(--ps-gold)' },
  pendiente: { background: 'rgba(224,92,92,0.18)',    color: 'var(--ps-red)' },
  anulada:   { background: 'rgba(150,150,150,0.18)',  color: 'var(--ps-text-muted)' },
  all:       { background: 'rgba(201,168,76,0.12)',   color: 'var(--ps-gold)' },
})[value];

export function VentasContent({ sales, clients, products }: VentasContentProps) {
  const router = useRouter();
  const [showNewSale, setShowNewSale] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [tracingSale, setTracingSale] = useState<Sale | null>(null);
  const [anullingSale, setAnullingSale] = useState<Sale | null>(null);
  const [anulandoLoading, setAnulandoLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleAnular = useCallback(async () => {
    if (!anullingSale) return;
    setAnulandoLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/${anullingSale.id}/anular`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Error al anular la venta');
      }
      toast.success('Venta anulada correctamente');
      router.refresh();
      setAnullingSale(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al anular la venta');
    } finally {
      setAnulandoLoading(false);
    }
  }, [anullingSale, router]);

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
            key: '_id', header: 'ID',
            render: (s) => <IdBadge id={s.id} />,
          },
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
          {
            key: '_actions', header: '',
            render: (s) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTracingSale(s); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                  title="Ver trazabilidad"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingSale(s); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                  title="Editar venta"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {s.status !== 'ANULADA' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setAnullingSale(s); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--ps-red)', background: 'var(--ps-surface)' }}
                    title="Anular venta"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      {showNewSale && (
        <NewSaleDialog clients={clients} products={products} onClose={() => setShowNewSale(false)} />
      )}

      {editingSale && (
        <EditSaleDialog sale={editingSale} onClose={() => setEditingSale(null)} />
      )}

      {tracingSale && (
        <TraceChainModal sale={tracingSale} onClose={() => setTracingSale(null)} />
      )}

      {anullingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAnullingSale(null)} />
          <div className="card-persenso p-6 w-full max-w-sm relative z-10">
            <h2 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--ps-red)' }}>
              Anular venta
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--ps-text-muted)' }}>
              ¿Anular esta venta de{' '}
              <span style={{ color: 'var(--ps-text)' }} className="font-medium">
                {anullingSale.client?.name ?? 'cliente desconocido'}
              </span>?
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--ps-text-muted)' }}>
              Se restaurará el stock. El registro se conserva para auditoría.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAnullingSale(null)}
                disabled={anulandoLoading}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnular}
                disabled={anulandoLoading}
                className="flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-50"
                style={{ background: 'rgba(224,92,92,0.15)', color: 'var(--ps-red)', border: '1px solid rgba(224,92,92,0.3)' }}
              >
                {anulandoLoading ? 'Anulando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
