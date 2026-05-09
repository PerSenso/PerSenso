'use client';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { LedgerSummary } from '@persenso/shared';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface SaldoContentProps {
  ledger: LedgerSummary;
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function SaldoContent({ ledger }: SaldoContentProps) {
  return (
    <>
      <AdminPageHeader title="Saldo / Caja" subtitle="Control de ingresos y egresos" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AdminStatCard
          title="Balance"
          value={formatCurrency(ledger.balance)}
          icon={Wallet}
          color={ledger.balance >= 0 ? 'green' : 'red'}
        />
        <AdminStatCard
          title="Total Ingresos"
          value={formatCurrency(ledger.totalIn)}
          icon={TrendingUp}
          color="green"
        />
        <AdminStatCard
          title="Total Egresos"
          value={formatCurrency(ledger.totalOut)}
          icon={TrendingDown}
          color="red"
        />
      </div>

      {/* Payments by method */}
      {ledger.paymentsByMethod.length > 0 && (
        <div className="card-persenso p-6 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            Ingresos por Método de Pago
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ledger.paymentsByMethod.map((pm) => (
              <div
                key={pm.method}
                className="p-3 rounded-lg"
                style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3 h-3" style={{ color: 'var(--ps-gold)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                    {pm.method}
                  </span>
                </div>
                <p className="text-lg font-semibold" style={{ color: 'var(--ps-text)' }}>
                  {formatCurrency(pm.total)}
                </p>
                <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                  {pm.count} pagos
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements table */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
          Movimientos Manuales
        </h2>
        <AdminDataTable
          data={ledger.movements}
          keyExtractor={(m) => m.id}
          emptyMessage="No hay movimientos manuales registrados"
          columns={[
            {
              key: 'date',
              header: 'Fecha',
              sortable: true,
              render: (m) => new Date(m.date).toLocaleDateString('es-VE'),
            },
            {
              key: 'type',
              header: 'Tipo',
              render: (m) => (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: m.type === 'ingreso' ? 'rgba(76, 175, 125, 0.15)' : 'rgba(224, 92, 92, 0.15)',
                    color: m.type === 'ingreso' ? 'var(--ps-green)' : 'var(--ps-red)',
                  }}
                >
                  {m.type === 'ingreso' ? '↑ Ingreso' : '↓ Retiro'}
                </span>
              ),
            },
            {
              key: 'source',
              header: 'Fuente',
              render: (m) => m.source,
            },
            {
              key: 'method',
              header: 'Método',
              render: (m) => m.method,
            },
            {
              key: 'amount',
              header: 'Monto',
              sortable: true,
              align: 'right',
              render: (m) => (
                <span
                  className="font-semibold"
                  style={{ color: m.type === 'ingreso' ? 'var(--ps-green)' : 'var(--ps-red)' }}
                >
                  {m.type === 'ingreso' ? '+' : '-'}{formatCurrency(Number(m.amount))}
                </span>
              ),
            },
            {
              key: 'notes',
              header: 'Notas',
              render: (m) => (
                <span className="text-xs truncate max-w-[150px] block" style={{ color: 'var(--ps-text-muted)' }}>
                  {m.notes || '—'}
                </span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
