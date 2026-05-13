'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminModal } from '@/components/admin/AdminModal';
import type { CashMovement } from '@persenso/shared';
import { Receipt, Plus, Pencil, Trash2 } from 'lucide-react';
import { NotaCell } from '@/components/admin/NotaCell';
import { NewGastoDialog } from './NewGastoDialog';
import { EditGastoDialog } from './EditGastoDialog';

interface GastosContentProps {
  gastos: CashMovement[];
  totalGastos: number;
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function GastosContent({ gastos, totalGastos }: GastosContentProps) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<CashMovement | null>(null);
  const [deleting, setDeleting] = useState<CashMovement | null>(null);
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
      <AdminPageHeader
        title="Gastos"
        subtitle={`${gastos.length} movimientos de retiro`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </button>
        }
      />
      {showNew && <NewGastoDialog onClose={() => setShowNew(false)} />}
      {editing && <EditGastoDialog movement={editing} onClose={() => setEditing(null)} />}

      {/* Delete confirmation modal */}
      {deleting && (
        <AdminModal title="Eliminar Gasto" onClose={() => setDeleting(null)}>
          <p className="text-sm mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            ¿Seguro que deseas eliminar el gasto{' '}
            <strong style={{ color: 'var(--ps-text)' }}>{deleting.source}</strong>{' '}
            por <strong style={{ color: 'var(--ps-red)' }}>{formatCurrency(Number(deleting.amount))}</strong>?
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

      <div className="mb-8">
        <AdminStatCard
          title="Total Gastos"
          value={formatCurrency(totalGastos)}
          icon={Receipt}
          color="red"
        />
      </div>

      <AdminDataTable
        data={gastos}
        keyExtractor={(m) => m.id}
        emptyMessage="No hay gastos registrados"
        searchable
        searchPlaceholder="Buscar por fuente o método…"
        searchKeys={['source', 'method', 'notes', 'owner']}
        columns={[
          {
            key: 'date', header: 'Fecha', sortable: true,
            render: (m) => new Date(m.date).toLocaleDateString('es-VE'),
          },
          { key: 'source', header: 'Fuente', sortable: true, render: (m) => m.source },
          { key: 'owner', header: '¿Quién?', render: (m) => m.owner ? (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
              {m.owner}
            </span>
          ) : <span style={{ color: 'var(--ps-text-muted)' }}>—</span> },
          { key: 'method', header: 'Método', render: (m) => m.method },
          {
            key: 'amount', header: 'Monto', sortable: true, align: 'right',
            render: (m) => (
              <span className="font-semibold tabular-nums" style={{ color: 'var(--ps-red)' }}>
                -{formatCurrency(Number(m.amount))}
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
    </>
  );
}
