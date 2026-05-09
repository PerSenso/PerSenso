'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Client } from '@persenso/shared';
import { Plus } from 'lucide-react';
import { NewClienteDialog } from './NewClienteDialog';

interface ClientesContentProps {
  clients: Client[];
}

export function ClientesContent({ clients }: ClientesContentProps) {
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes registrados`}
        actions={
          <button onClick={() => setShowNew(true)} className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
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
        columns={[
          {
            key: 'name',
            header: 'Nombre',
            sortable: true,
            render: (c) => (
              <span className="font-medium" style={{ color: 'var(--ps-text)' }}>
                {c.name}
              </span>
            ),
          },
          {
            key: 'ci',
            header: 'Cédula',
            render: (c) => c.ci || '—',
          },
          {
            key: 'phone',
            header: 'Teléfono',
            render: (c) => c.phone || '—',
          },
          {
            key: 'address',
            header: 'Dirección',
            render: (c) => (
              <span className="text-xs truncate max-w-[200px] block" style={{ color: 'var(--ps-text-muted)' }}>
                {c.address || '—'}
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Registro',
            sortable: true,
            render: (c) => new Date(c.createdAt).toLocaleDateString('es-VE'),
          },
        ]}
      />
    </>
  );
}
