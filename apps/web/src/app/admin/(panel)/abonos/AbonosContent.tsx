'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import type { SaleWithDebt, Payment } from '@persenso/shared';
import { CreditCard, List } from 'lucide-react';
import { AbonarDialog } from './AbonarDialog';
import { IdBadge } from '@/components/admin/IdBadge';
import { NotaCell } from '@/components/admin/NotaCell';

interface AbonosContentProps {
  salesWithDebt: SaleWithDebt[];
}

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

function PendingBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ps-border)', minWidth: 60 }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--ps-green)' : 'var(--ps-gold)' }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function HistorialModal({ sale, onClose }: { sale: SaleWithDebt; onClose: () => void }) {
  const payments: Payment[] = sale.payments;
  return (
    <AdminModal title={`Historial — ${sale.client.name}`} onClose={onClose}>
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--ps-text)' }}>
          {sale.product.name}
        </p>
        <div className="flex gap-4 text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--ps-text)' }}>{formatCurrency(sale.total)}</strong></span>
          <span>Pagado: <strong style={{ color: 'var(--ps-green)' }}>{formatCurrency(sale.paid)}</strong></span>
          <span>Pendiente: <strong style={{ color: 'var(--ps-red)' }}>{formatCurrency(sale.pending)}</strong></span>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
          Sin abonos registrados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
                <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Fecha</th>
                <th className="text-right py-2 font-medium text-xs uppercase tracking-widest">Monto</th>
                <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Método</th>
                <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Notas</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--ps-border)' }}>
                  <td className="py-2" style={{ color: 'var(--ps-text-soft)' }}>
                    {new Date(p.date).toLocaleDateString('es-VE')}
                  </td>
                  <td className="py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--ps-green)' }}>
                    {formatCurrency(Number(p.amount))}
                  </td>
                  <td className="py-2" style={{ color: 'var(--ps-text-soft)' }}>
                    {p.paymentMethod}
                  </td>
                  <td className="py-2">
                    <NotaCell text={p.notes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
        >
          Cerrar
        </button>
      </div>
    </AdminModal>
  );
}

export function AbonosContent({ salesWithDebt }: AbonosContentProps) {
  const router = useRouter();
  const [abonarSale, setAbonarSale] = useState<SaleWithDebt | null>(null);
  const [historialSale, setHistorialSale] = useState<SaleWithDebt | null>(null);

  const totalDebt = salesWithDebt.reduce((s, x) => s + x.pending, 0);

  return (
    <>
      <AdminPageHeader
        title="Abonos"
        subtitle={`${salesWithDebt.length} venta(s) con deuda · ${formatCurrency(totalDebt)} pendiente`}
      />

      {abonarSale && (
        <AbonarDialog
          sale={abonarSale}
          onClose={() => setAbonarSale(null)}
          onSuccess={() => router.refresh()}
        />
      )}
      {historialSale && (
        <HistorialModal sale={historialSale} onClose={() => setHistorialSale(null)} />
      )}

      <AdminDataTable
        data={salesWithDebt}
        keyExtractor={(s) => s.id}
        emptyMessage="No hay ventas con deuda pendiente"
        searchable
        searchPlaceholder="Buscar por cliente o producto…"
        searchKeys={['client.name', 'product.name']}
        columns={[
          { key: '_id', header: 'ID', render: (s) => <IdBadge id={s.id} /> },
          {
            key: 'date', header: 'Fecha', sortable: true,
            render: (s) => new Date(s.date).toLocaleDateString('es-VE'),
          },
          {
            key: 'client', header: 'Cliente',
            render: (s) => (
              <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{s.client.name}</span>
            ),
          },
          {
            key: 'product', header: 'Producto',
            render: (s) => s.product.name,
          },
          {
            key: 'total', header: 'Total', sortable: true, align: 'right',
            render: (s) => (
              <span className="tabular-nums" style={{ color: 'var(--ps-text-soft)' }}>
                {formatCurrency(s.total)}
              </span>
            ),
          },
          {
            key: 'paid', header: 'Pagado', align: 'right',
            render: (s) => (
              <span className="tabular-nums font-medium" style={{ color: 'var(--ps-green)' }}>
                {formatCurrency(s.paid)}
              </span>
            ),
          },
          {
            key: 'pending', header: 'Pendiente', sortable: true, align: 'right',
            render: (s) => (
              <span className="tabular-nums font-semibold" style={{ color: 'var(--ps-red)' }}>
                {formatCurrency(s.pending)}
              </span>
            ),
          },
          {
            key: '_bar', header: 'Avance',
            render: (s) => <PendingBar paid={s.paid} total={s.total} />,
          },
          {
            key: '_actions', header: '',
            render: (s) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setHistorialSale(s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
                  title="Ver historial de abonos"
                >
                  <List className="w-3.5 h-3.5" />
                  Historial
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setAbonarSale(s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest btn-gold"
                  title="Registrar abono"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Abonar
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
