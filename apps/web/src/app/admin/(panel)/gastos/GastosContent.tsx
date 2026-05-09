'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import type { CashMovement } from '@persenso/shared';
import { Receipt, Plus } from 'lucide-react';
import { NotaCell } from '@/components/admin/NotaCell';
import { NewGastoDialog } from './NewGastoDialog';

interface GastosContentProps {
  gastos: CashMovement[];
  totalGastos: number;
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function GastosContent({ gastos, totalGastos }: GastosContentProps) {
  const [showNew, setShowNew] = useState(false);

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
        searchKeys={['source', 'method', 'notes']}
        columns={[
          {
            key: 'date', header: 'Fecha', sortable: true,
            render: (m) => new Date(m.date).toLocaleDateString('es-VE'),
          },
          { key: 'source', header: 'Fuente', sortable: true, render: (m) => m.source },
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
        ]}
      />
    </>
  );
}
