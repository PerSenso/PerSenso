'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import type { ClientWithDebt } from '@persenso/shared';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { NewClienteDialog } from './NewClienteDialog';
import { EditClienteDialog } from './EditClienteDialog';
import { ClienteDetailModal } from './ClienteDetailModal';
import { NotaCell } from '@/components/admin/NotaCell';
import { IdBadge } from '@/components/admin/IdBadge';

interface ClientesContentProps {
  clients: ClientWithDebt[];
}

function formatDebt(debt: number) {
  if (debt <= 0) return '—';
  return `$${debt.toFixed(2)}`;
}

export function ClientesContent({ clients }: ClientesContentProps) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithDebt | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientWithDebt | null>(null);
  const [detailClient, setDetailClient] = useState<ClientWithDebt | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deletingClient) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${deletingClient.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Error al eliminar');
      }
      toast.success('Cliente eliminado');
      router.refresh();
      setDeletingClient(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el cliente');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes registrados`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        }
      />
      {showNew && <NewClienteDialog onClose={() => setShowNew(false)} />}
      {editingClient && <EditClienteDialog client={editingClient} onClose={() => setEditingClient(null)} />}
      {detailClient && <ClienteDetailModal client={detailClient} onClose={() => setDetailClient(null)} />}

      {deletingClient && (
        <AdminModal title="Eliminar Cliente" onClose={() => setDeletingClient(null)}>
          <p className="text-sm mb-6" style={{ color: 'var(--ps-text-soft)' }}>
            ¿Eliminar a <strong style={{ color: 'var(--ps-text)' }}>{deletingClient.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingClient(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-50"
              style={{ background: 'var(--ps-red)', color: '#fff' }}
            >
              {deleteLoading ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </AdminModal>
      )}

      <AdminDataTable
        data={clients}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => setDetailClient(c)}
        emptyMessage="No hay clientes registrados"
        searchable
        searchPlaceholder="Buscar por nombre, cédula o teléfono…"
        searchKeys={['name', 'ci', 'phone']}
        columns={[
          { key: '_id', header: 'ID', render: (c) => <IdBadge id={c.id} /> },
          {
            key: 'name', header: 'Nombre', sortable: true,
            render: (c) => (
              <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{c.name}</span>
            ),
          },
          { key: 'ci', header: 'Cédula', render: (c) => c.ci || '—' },
          { key: 'phone', header: 'Teléfono', render: (c) => c.phone || '—' },
          {
            key: 'address', header: 'Dirección',
            render: (c) => <NotaCell text={c.address} />,
          },
          {
            key: 'createdAt', header: 'Registro', sortable: true,
            render: (c) => new Date(c.createdAt).toLocaleDateString('es-VE'),
          },
          {
            key: 'debt', header: 'Deuda', align: 'right', sortable: true,
            render: (c) => (
              <span className="font-semibold tabular-nums"
                style={{ color: c.debt > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' }}>
                {formatDebt(c.debt)}
              </span>
            ),
          },
          {
            key: '_actions', header: '',
            render: (c) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingClient(c); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                  title="Editar cliente"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingClient(c); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--ps-red)', background: 'var(--ps-surface)' }}
                  title="Eliminar cliente"
                >
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
