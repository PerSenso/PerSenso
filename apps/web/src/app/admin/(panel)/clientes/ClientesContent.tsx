'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { ClientWithDebt } from '@persenso/shared';
import { Plus } from 'lucide-react';
import { NewClienteDialog } from './NewClienteDialog';
import { NotaCell } from '@/components/admin/NotaCell';

interface ClientesContentProps {
  clients: ClientWithDebt[];
}

function formatDebt(debt: number) {
  if (debt <= 0) return '—';
  return `$${debt.toFixed(2)}`;
}

export function ClientesContent({ clients }: ClientesContentProps) {
  const [showNew, setShowNew] = useState(false);

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

      <AdminDataTable
        data={clients}
        keyExtractor={(c) => c.id}
        emptyMessage="No hay clientes registrados"
        searchable
        searchPlaceholder="Buscar por nombre, cédula o teléfono…"
        searchKeys={['name', 'ci', 'phone']}
        columns={[
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
        ]}
      />
    </>
  );
}
