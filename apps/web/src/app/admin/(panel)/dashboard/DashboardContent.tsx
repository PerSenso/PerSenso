'use client';

import { useState } from 'react';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { NotaCell } from '@/components/admin/NotaCell';
import { ClienteDetailModal } from '@/app/admin/(panel)/clientes/ClienteDetailModal';
import {
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import type {
  Sale,
  DashboardDebt,
  DashboardSalesStatus,
  DashboardTopClient,
  Payment,
} from '@persenso/shared';

interface DashboardSummary {
  salesCount: number;
  totalRevenue: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  recentSales: Sale[];
}

interface DashboardContentProps {
  salesCount: number;
  clientsCount: number;
  productsCount: number;
  totalRevenue: number;
  balance: number;
  totalIn: number;
  totalOut: number;
  recentSales: Sale[];
  initialDebts: DashboardDebt[];
  initialSalesStatus: DashboardSalesStatus;
  initialTopClients: DashboardTopClient[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const paid = (sale.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const pending = Math.max(0, Number(sale.total) - paid);
  return (
    <AdminModal title={sale.client?.name ?? 'Detalle de Venta'} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="rounded-lg px-4 py-3 space-y-1" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--ps-text-muted)' }}>Venta</p>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--ps-text-muted)' }}>Producto</span>
            <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{sale.product?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--ps-text-muted)' }}>Fecha</span>
            <span style={{ color: 'var(--ps-text)' }}>{new Date(sale.date).toLocaleDateString('es-VE')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',   value: formatCurrency(Number(sale.total)), color: 'var(--ps-text)' },
            { label: 'Pagado',  value: formatCurrency(paid),               color: 'var(--ps-green)' },
            { label: 'Saldo',   value: pending > 0 ? formatCurrency(pending) : '—', color: pending > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>{label}</p>
              <p className="text-base font-bold tabular-nums" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {(sale.payments ?? []).length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--ps-text-muted)' }}>Pagos</p>
            <div className="space-y-1.5">
              {(sale.payments ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                  <div className="text-sm">
                    <span className="font-medium" style={{ color: 'var(--ps-green)' }}>{formatCurrency(Number(p.amount))}</span>
                    <span className="mx-1.5 text-xs" style={{ color: 'var(--ps-text-muted)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{p.paymentMethod}</span>
                    <span className="mx-1.5 text-xs" style={{ color: 'var(--ps-text-muted)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{new Date(p.date).toLocaleDateString('es-VE')}</span>
                  </div>
                  {p.receiptUrl && (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer"
                      className="w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: 'var(--ps-gold)' }} title="Ver comprobante">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

function HistorialModal({ debt, onClose }: { debt: DashboardDebt; onClose: () => void }) {
  const payments: Payment[] = debt.payments;
  return (
    <AdminModal title={`Historial — ${debt.clientName}`} onClose={onClose}>
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--ps-text)' }}>
          {debt.productName}
        </p>
        <div className="flex gap-4 text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--ps-text)' }}>{formatCurrency(debt.total)}</strong></span>
          <span>Pagado: <strong style={{ color: 'var(--ps-green)' }}>{formatCurrency(debt.paid)}</strong></span>
          <span>Pendiente: <strong style={{ color: 'var(--ps-red)' }}>{formatCurrency(debt.pending)}</strong></span>
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

export function DashboardContent({
  salesCount,
  clientsCount,
  productsCount,
  totalRevenue,
  balance,
  totalIn,
  totalOut,
  recentSales,
  initialDebts,
  initialSalesStatus,
  initialTopClients,
}: DashboardContentProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [debts, setDebts] = useState<DashboardDebt[]>(initialDebts);
  const [salesStatus, setSalesStatus] = useState<DashboardSalesStatus>(initialSalesStatus);
  const [topClients, setTopClients] = useState<DashboardTopClient[]>(initialTopClients);
  const [summary, setSummary] = useState<DashboardSummary>({
    salesCount, totalRevenue, totalIn, totalOut, balance, recentSales,
  });
  const [historialDebt, setHistorialDebt] = useState<DashboardDebt | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchWithDates(start: string, end: string) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set('startDate', start);
      if (end) qs.set('endDate', end);
      const q = qs.toString() ? `?${qs.toString()}` : '';

      const [d, s, t, sm] = await Promise.all([
        fetch(`/api/admin/dashboard/debts${q}`).then((r) => r.json()),
        fetch(`/api/admin/dashboard/sales-status${q}`).then((r) => r.json()),
        fetch(`/api/admin/dashboard/top-clients${q}`).then((r) => r.json()),
        fetch(`/api/admin/dashboard/summary${q}`).then((r) => r.json()),
      ]);

      setDebts(d);
      setSalesStatus(s);
      setTopClients(t);
      setSummary(sm);
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(newStart: string, newEnd: string) {
    setStartDate(newStart);
    setEndDate(newEnd);
    fetchWithDates(newStart, newEnd);
  }

  function handleClear() {
    setStartDate('');
    setEndDate('');
    setDebts(initialDebts);
    setSalesStatus(initialSalesStatus);
    setTopClients(initialTopClients);
    setSummary({ salesCount, totalRevenue, totalIn, totalOut, balance, recentSales });
  }

  const statusCards = [
    {
      label: 'Pagadas',
      data: salesStatus.paid,
      icon: CheckCircle,
      color: 'var(--ps-green)',
      bg: 'rgba(76, 175, 125, 0.1)',
    },
    {
      label: 'Parciales',
      data: salesStatus.partial,
      icon: Clock,
      color: 'var(--ps-gold)',
      bg: 'rgba(212, 175, 55, 0.1)',
    },
    {
      label: 'Pendientes',
      data: salesStatus.pending,
      icon: AlertCircle,
      color: 'var(--ps-red)',
      bg: 'rgba(224, 92, 92, 0.1)',
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Resumen general del negocio"
      />

      {/* Filtro por período */}
      <div
        className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-xl"
        style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest mr-1" style={{ color: 'var(--ps-text-muted)' }}>
          Período
        </span>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>Desde</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange(e.target.value, endDate)}
              className="text-sm bg-transparent outline-none"
              style={{
                color: startDate ? 'var(--ps-text)' : 'var(--ps-text-muted)',
                minWidth: 120,
              }}
            />
          </div>

          <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>→</span>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>Hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange(startDate, e.target.value)}
              className="text-sm bg-transparent outline-none"
              style={{
                color: endDate ? 'var(--ps-text)' : 'var(--ps-text-muted)',
                minWidth: 120,
              }}
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-bg)', border: '1px solid var(--ps-border)' }}
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}

          {loading && (
            <span className="text-xs animate-pulse" style={{ color: 'var(--ps-text-muted)' }}>
              Actualizando…
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <AdminStatCard
          title="Ventas Totales"
          value={summary.salesCount}
          subtitle={`${formatCurrency(summary.totalRevenue)} en ingresos`}
          icon={ShoppingCart}
          color="gold"
        />
        <AdminStatCard
          title="Clientes"
          value={clientsCount}
          icon={Users}
          color="blue"
        />
        <AdminStatCard
          title="Productos"
          value={productsCount}
          icon={Package}
          color="green"
        />
        <AdminStatCard
          title="Balance Caja"
          value={formatCurrency(summary.balance)}
          icon={DollarSign}
          color={summary.balance >= 0 ? 'green' : 'red'}
        />
        <AdminStatCard
          title="Deuda Total Clientes"
          value={formatCurrency(debts.reduce((s, d) => s + d.pending, 0))}
          subtitle={`${debts.length} ventas pendientes`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Income / Expense summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-persenso p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(76, 175, 125, 0.1)' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--ps-green)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                Ingresos
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--ps-green)' }}>
                {formatCurrency(summary.totalIn)}
              </p>
            </div>
          </div>
        </div>

        <div className="card-persenso p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(224, 92, 92, 0.1)' }}
            >
              <TrendingDown className="w-4 h-4" style={{ color: 'var(--ps-red)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                Egresos
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--ps-red)' }}>
                {formatCurrency(summary.totalOut)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de Ventas */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
          Estado de Ventas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statusCards.map(({ label, data, icon: Icon, color, bg }) => (
            <div key={label} className="card-persenso p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                  {label}
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                {data.count}
              </p>
              <p className="text-xs tabular-nums mt-1" style={{ color: 'var(--ps-text-muted)' }}>
                {formatCurrency(data.total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Deudas Pendientes */}
      <div className="mb-8 card-persenso p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
          Deudas Pendientes{' '}
          {debts.length > 0 && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(224, 92, 92, 0.15)', color: 'var(--ps-red)' }}
            >
              {debts.length}
            </span>
          )}
        </h2>
        {debts.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
            No hay deudas pendientes
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
                  <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Cliente</th>
                  <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Producto</th>
                  <th className="text-left py-2 font-medium text-xs uppercase tracking-widest">Fecha</th>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-widest">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setHistorialDebt(d)}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderBottom: '1px solid var(--ps-border)' }}
                  >
                    <td className="py-2 font-medium" style={{ color: 'var(--ps-text)' }}>
                      {d.clientName}
                    </td>
                    <td className="py-2" style={{ color: 'var(--ps-text-soft)' }}>
                      {d.productName}
                    </td>
                    <td className="py-2" style={{ color: 'var(--ps-text-muted)' }}>
                      {new Date(d.date).toLocaleDateString('es-VE')}
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--ps-red)' }}>
                      {formatCurrency(d.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Clientes + Últimas Ventas — lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Clientes */}
        <div className="card-persenso p-6 flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
            Top Clientes
          </h2>
          {topClients.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
              No hay datos de clientes
            </p>
          ) : (
            <div className="overflow-y-auto pr-3" style={{ maxHeight: 320 }}>
              {topClients.slice(0, 10).map((c, i) => (
                <div
                  key={c.clientId}
                  onClick={() => setSelectedClientId({ id: c.clientId, name: c.name })}
                  className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg px-1 transition-colors"
                  style={{ borderBottom: '1px solid var(--ps-border)' }}
                >
                  <span className="text-xs font-bold tabular-nums w-5 text-right flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: 'var(--ps-gold)', color: 'var(--ps-bg)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ps-text)' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                      {c.salesCount} {c.salesCount === 1 ? 'venta' : 'ventas'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--ps-gold)' }}>
                    {formatCurrency(c.totalPaid)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Ventas */}
        <div className="card-persenso p-6 flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4 flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
            Últimas Ventas
          </h2>
          {summary.recentSales.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
              No hay ventas registradas
            </p>
          ) : (
            <div className="overflow-auto pr-3" style={{ maxHeight: 320 }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: 'var(--ps-card-bg, var(--ps-bg))' }}>
                  <tr style={{ borderBottom: '1px solid var(--ps-border)' }}>
                    {['Cliente / Producto', 'Fecha', 'Total', 'Saldo'].map((h) => (
                      <th key={h} className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.recentSales.map((sale) => {
                    const paid = (sale.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
                    const pending = Math.max(0, Number(sale.total) - paid);
                    return (
                      <tr key={sale.id} onClick={() => setSelectedSale(sale)}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                        style={{ borderBottom: '1px solid var(--ps-border)' }}>
                        <td className="py-2 px-2 w-full max-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--ps-text)' }}>
                            {sale.client?.name ?? '—'}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--ps-text-muted)' }}>
                            {sale.product?.name ?? '—'}
                          </p>
                        </td>
                        <td className="py-2 px-2 tabular-nums whitespace-nowrap text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                          {new Date(sale.date).toLocaleDateString('es-VE')}
                        </td>
                        <td className="py-2 px-2 tabular-nums font-semibold whitespace-nowrap text-sm" style={{ color: 'var(--ps-gold)' }}>
                          {formatCurrency(Number(sale.total))}
                        </td>
                        <td className="py-2 px-2 tabular-nums font-semibold whitespace-nowrap text-sm"
                          style={{ color: pending > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' }}>
                          {pending > 0 ? formatCurrency(pending) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {historialDebt && (
        <HistorialModal debt={historialDebt} onClose={() => setHistorialDebt(null)} />
      )}

      {selectedSale && (
        <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}

      {selectedClientId && (
        <ClienteDetailModal
          client={{ id: selectedClientId.id, name: selectedClientId.name, debt: 0, salesCount: 0, createdAt: '', updatedAt: '' }}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </>
  );
}
