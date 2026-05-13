'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { ReportsSummary } from '@persenso/shared';
import { BarChart3, DollarSign } from 'lucide-react';

interface ReportesContentProps {
  reports: ReportsSummary;
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export function ReportesContent({ reports: initialReports }: ReportesContentProps) {
  const [reports, setReports] = useState<ReportsSummary>(initialReports);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchWithDates(start: string, end: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      const qs = params.toString();
      const res = await fetch(`/api/admin/reports/summary${qs ? `?${qs}` : ''}`);
      if (res.ok) {
        const data: ReportsSummary = await res.json();
        setReports(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleStartDate(val: string) {
    setStartDate(val);
    // if endDate is now before new startDate, clear it
    if (endDate && val > endDate) setEndDate('');
    else if (val && endDate && val <= endDate) fetchWithDates(val, endDate);
  }

  function handleEndDate(val: string) {
    setEndDate(val);
    if (startDate && val && val >= startDate) fetchWithDates(startDate, val);
  }

  function handleClear() {
    setStartDate('');
    setEndDate('');
    fetchWithDates('', '');
  }

  const inputStyle = {
    background: 'var(--ps-input-bg)',
    border: '1px solid var(--ps-input-border)',
    color: 'var(--ps-input-text)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
  };

  return (
    <>
      <AdminPageHeader title="Reportes" subtitle="Métricas financieras del negocio" />

      {/* Date filter */}
      <div className="card-persenso p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => handleStartDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => handleEndDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm rounded-lg font-medium"
            style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}
          >
            Limpiar
          </button>
        )}
        {loading && (
          <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Cargando…</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <AdminStatCard title="Deuda Total Clientes" value={formatCurrency(reports.totalDebt)} icon={DollarSign} color="red" />
        <AdminStatCard title="Productos Analizados" value={reports.topProducts.length} icon={BarChart3} color="gold" />
      </div>

      {/* Sales by Month */}
      <div className="card-persenso p-6 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Ventas por Mes</h2>
        {reports.salesByMonth.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--ps-text-muted)' }}>Sin datos</p>
        ) : (
          <div className="space-y-3">
            {reports.salesByMonth.map((m) => (
              <div key={m.month} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ps-border)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--ps-text)' }}>
                  {new Date(m.month).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-6 text-sm">
                  <span style={{ color: 'var(--ps-text-muted)' }}>{m.sales_count} ventas</span>
                  <span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(m.revenue)}</span>
                  <span style={{ color: 'var(--ps-green)' }}>{formatCurrency(m.profit)} profit</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products */}
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Top Productos</h2>
      <AdminDataTable
        data={reports.topProducts}
        keyExtractor={(p) => p.name}
        emptyMessage="Sin datos de productos"
        columns={[
          { key: 'name', header: 'Producto', sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
          { key: 'sales_count', header: 'Ventas', sortable: true, align: 'center' },
          { key: 'revenue', header: 'Ingresos', sortable: true, align: 'right', render: (p) => <span style={{ color: 'var(--ps-gold)' }}>{formatCurrency(p.revenue)}</span> },
          { key: 'avg_margin', header: 'Margen %', sortable: true, align: 'right', render: (p) => <span style={{ color: 'var(--ps-green)' }}>{Number(p.avg_margin).toFixed(1)}%</span> },
        ]}
      />

      {/* Margin by Product */}
      {reports.marginByProduct.length > 0 && (
        <div className="card-persenso p-6 mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Margen por Producto</h2>
          <div className="space-y-3">
            {reports.marginByProduct.map((m) => (
              <div key={m.name} className="flex items-center gap-4">
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--ps-text)' }}>{m.name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ps-border)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(m.avg_margin_pct, 100)}%`, background: 'var(--ps-gold)' }}
                  />
                </div>
                <span className="text-sm font-semibold w-14 text-right" style={{ color: 'var(--ps-gold)' }}>
                  {Number(m.avg_margin_pct).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
