'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import type { LedgerSummary, FundingContribution, CashMovement } from '@persenso/shared';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo', pago_movil: 'Pago Móvil',
  zelle: 'Zelle', usdt: 'USDT', otro: 'Otro',
  transferencia: 'Transferencia',
};
const fmtMethod = (m: string) => METHOD_LABELS[m] ?? m;
import { NotaCell } from '@/components/admin/NotaCell';
import { EditMovementDialog } from './EditMovementDialog';
import { CambioDialog } from './CambioDialog';

interface SaldoContentProps {
  ledger: LedgerSummary;
  contributions: FundingContribution[];
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function InvestorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
      style={{ background: 'var(--ps-gold)', color: '#0a0a0a' }}>
      {initial}
    </div>
  );
}

export function SaldoContent({ ledger, contributions }: SaldoContentProps) {
  const router = useRouter();
  const socios = contributions.map((c) => c.investor);
  const [editing, setEditing] = useState<CashMovement | null>(null);
  const [deleting, setDeleting] = useState<CashMovement | null>(null);
  const [showCambio, setShowCambio] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/movements/${deleting.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'Error al eliminar');
      }
      setDeleting(null);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <AdminPageHeader title="Saldo / Caja" subtitle="Control de ingresos y egresos" />

      {editing && <EditMovementDialog movement={editing} socios={socios} onClose={() => setEditing(null)} />}
      {showCambio && <CambioDialog socios={socios} onClose={() => setShowCambio(false)} onSuccess={() => router.refresh()} />}

      {deleting && (
        <AdminModal title="Eliminar Movimiento" onClose={() => setDeleting(null)}>
          <p className="text-sm mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            ¿Seguro que deseas eliminar el movimiento{' '}
            <strong style={{ color: 'var(--ps-text)' }}>{deleting.source}</strong>{' '}
            por <strong style={{ color: deleting.type === 'ingreso' ? 'var(--ps-green)' : 'var(--ps-red)' }}>
              {formatCurrency(Number(deleting.amount))}
            </strong>?
            Esta acción no se puede deshacer.
          </p>
          {deleteError && <p className="text-xs mb-3" style={{ color: 'var(--ps-red)' }}>{deleteError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setDeleting(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--ps-red)', color: '#fff' }}>
              {deleteLoading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </AdminModal>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AdminStatCard
          title="Balance"
          value={formatCurrency(ledger.balance)}
          icon={Wallet}
          color={ledger.balance >= 0 ? 'green' : 'red'}
        />
        <AdminStatCard title="Total Ingresos" value={formatCurrency(ledger.totalIn)} icon={TrendingUp} color="green" />
        <AdminStatCard title="Total Egresos" value={formatCurrency(ledger.totalOut)} icon={TrendingDown} color="red" />
      </div>

      {/* Payments by method */}
      {ledger.paymentsByMethod.length > 0 && (
        <div className="card-persenso p-6 mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            Ingresos por Método de Pago
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ledger.paymentsByMethod.map((pm) => (
              <div key={pm.method} className="p-3 rounded-lg"
                style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3 h-3" style={{ color: 'var(--ps-gold)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                    {fmtMethod(pm.method)}
                  </span>
                </div>
                <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--ps-text)' }}>
                  {formatCurrency(pm.total)}
                </p>
                <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{pm.count} pagos</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aportes por Socio */}
      {contributions.length > 0 && (
        <div className="card-persenso p-6 mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            Aportes por Socio
          </h2>
          <div className="space-y-3">
            {contributions.map((c) => (
              <div key={c.investor} className="flex items-center gap-3 py-2"
                style={{ borderBottom: '1px solid var(--ps-border)' }}>
                <InvestorAvatar name={c.investor} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize" style={{ color: 'var(--ps-text)' }}>
                    {c.investor}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    {c.ordersCount} {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ps-gold)' }}>
                  {formatCurrency(c.totalContributed)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            Movimientos Manuales
          </h2>
          <button
            onClick={() => setShowCambio(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--ps-gold)', border: '1px solid var(--ps-gold)' }}>
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Cambio de Divisa
          </button>
        </div>
        <AdminDataTable
          data={ledger.movements}
          keyExtractor={(m) => m.id}
          emptyMessage="No hay movimientos manuales registrados"
          searchable
          searchPlaceholder="Buscar por fuente, método o tipo…"
          searchKeys={['source', 'method', 'type', 'notes', 'owner']}
          columns={[
            {
              key: 'date', header: 'Fecha', sortable: true,
              render: (m) => new Date(m.date).toLocaleDateString('es-VE'),
            },
            {
              key: 'type', header: 'Tipo',
              render: (m) => (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: m.type === 'ingreso' ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.15)',
                    color: m.type === 'ingreso' ? 'var(--ps-green)' : 'var(--ps-red)',
                  }}>
                  {m.type === 'ingreso' ? '↑ Ingreso' : '↓ Retiro'}
                </span>
              ),
            },
            { key: 'source', header: 'Fuente', render: (m) => m.source },
            { key: 'owner', header: '¿Quién?', render: (m) => m.owner ? (
              <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{m.owner}</span>
            ) : null },
            { key: 'method', header: 'Método', render: (m) => m.method },
            {
              key: 'amount', header: 'Monto', sortable: true, align: 'right',
              render: (m) => (
                <span className="font-semibold tabular-nums"
                  style={{ color: m.type === 'ingreso' ? 'var(--ps-green)' : 'var(--ps-red)' }}>
                  {m.type === 'ingreso' ? '+' : '-'}{formatCurrency(Number(m.amount))}
                </span>
              ),
            },
            {
              key: 'notes', header: 'Notas',
              render: (m) => <NotaCell text={m.notes} />,
            },
            {
              key: 'actions', header: '',
              render: (m) => (
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => setEditing(m)}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface-hover)' }}
                    title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setDeleteError(''); setDeleting(m); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ color: 'var(--ps-red)', background: 'rgba(224,92,92,0.1)' }}
                    title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
