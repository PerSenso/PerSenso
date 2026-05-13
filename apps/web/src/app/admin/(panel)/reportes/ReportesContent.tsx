'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { ReportsSummary } from '@persenso/shared';
import { Download, FileText, DollarSign, ShoppingBag, TrendingUp, CreditCard } from 'lucide-react';

interface ReportesContentProps {
  reports: ReportsSummary;
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: 'gold' | 'red' | 'green' | 'blue';
}) {
  const colors = {
    gold: { bg: 'rgba(201,168,76,0.12)', text: 'var(--ps-gold)' },
    red: { bg: 'rgba(224,92,92,0.12)', text: 'var(--ps-red)' },
    green: { bg: 'rgba(74,198,128,0.12)', text: 'var(--ps-green)' },
    blue: { bg: 'rgba(99,179,237,0.12)', text: '#63b3ed' },
  };
  const c = colors[color];
  return (
    <div className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg, color: c.text }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--ps-text-muted)' }}>{title}</p>
        <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--ps-text)' }}>{value}</p>
        {sub && <p className="text-[10px]" style={{ color: 'var(--ps-text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
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
      if (res.ok) setReports(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function handleStartDate(val: string) {
    setStartDate(val);
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

  function exportCSV() {
    const lines: string[] = [];
    const period = startDate && endDate ? `${startDate} a ${endDate}` : 'Histórico completo';
    lines.push('Reporte PerSenso');
    lines.push(`Período,${period}`);
    lines.push('');

    lines.push('Ventas por Mes');
    lines.push('Mes,Ventas,Ingresos,Profit');
    for (const m of reports.salesByMonth) {
      const label = new Date(m.month).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
      lines.push(`${label},${m.sales_count},${m.revenue.toFixed(2)},${m.profit.toFixed(2)}`);
    }
    lines.push('');

    lines.push('Top Productos');
    lines.push('Producto,Ventas,Ingresos,Margen %');
    for (const p of reports.topProducts) {
      lines.push(`"${p.name}",${p.sales_count},${p.revenue.toFixed(2)},${Number(p.avg_margin).toFixed(1)}`);
    }
    lines.push('');

    lines.push('Top Clientes');
    lines.push('Cliente,Ventas,Total Facturado');
    for (const c of reports.topClients) {
      lines.push(`"${c.name}",${c.salesCount},${c.totalSpent.toFixed(2)}`);
    }
    lines.push('');

    lines.push('Métodos de Pago');
    lines.push('Método,Total Cobrado,Transacciones');
    for (const p of reports.paymentsByMethod) {
      lines.push(`${p.method},${p.total.toFixed(2)},${p.count}`);
    }
    lines.push('');

    lines.push('Margen por Producto');
    lines.push('Producto,Margen %');
    for (const m of reports.marginByProduct) {
      lines.push(`"${m.name}",${Number(m.avg_margin_pct).toFixed(1)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-persenso-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const [pdfMakeModule, vfsFontsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfMake = (pdfMakeModule as any).default ?? pdfMakeModule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vfs = (vfsFontsModule as any).default ?? vfsFontsModule;
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs);
    } else {
      pdfMake.vfs = vfs;
    }

    const period = startDate && endDate ? `${startDate} — ${endDate}` : 'Histórico completo';
    const gold = '#c9a84c';
    const bg0 = '#141414';
    const bg1 = '#1e1e1e';
    const hdrBg = '#1a1a1a';
    const muted = '#888888';

    const rowBg = (i: number) => (i % 2 === 0 ? bg0 : bg1);

    const hRow = (cols: string[]) =>
      cols.map((c) => ({ text: c, bold: true, color: '#ffffff', fillColor: hdrBg, fontSize: 9, margin: [4, 4, 4, 4] }));

    const tableLayout = {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 0 : 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#2a2a2a',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    };

    const makeTable = (widths: (string | number)[], headerCols: string[], rows: object[][], margin = [0, 0, 0, 16]) => ({
      table: { headerRows: 1, widths, body: [hRow(headerCols), ...rows] },
      layout: tableLayout,
      margin,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDef: any = {
      pageSize: 'A4',
      pageMargins: [36, 44, 36, 44],
      background: (_page: number, pageSize: { width: number; height: number }) => ({
        canvas: [{ type: 'rect', x: 0, y: 0, w: pageSize.width, h: pageSize.height, color: '#0d0d0d' }],
      }),
      content: [
        { text: 'PerSenso', fontSize: 26, bold: true, color: gold, margin: [0, 0, 0, 2] },
        { text: 'Reporte Financiero', fontSize: 12, color: '#cccccc', margin: [0, 0, 0, 2] },
        { text: `Período: ${period}`, fontSize: 9, color: muted, margin: [0, 0, 0, 18] },

        // KPIs — simple table, 4 columns
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'VENTAS', fontSize: 8, color: muted, alignment: 'center', fillColor: hdrBg, border: [false, false, false, false] },
                { text: 'FACTURADO', fontSize: 8, color: muted, alignment: 'center', fillColor: hdrBg, border: [false, false, false, false] },
                { text: 'COBRADO', fontSize: 8, color: muted, alignment: 'center', fillColor: hdrBg, border: [false, false, false, false] },
                { text: 'DEUDA', fontSize: 8, color: muted, alignment: 'center', fillColor: hdrBg, border: [false, false, false, false] },
              ],
              [
                { text: String(totalSalesCount), fontSize: 20, bold: true, color: '#ffffff', alignment: 'center', fillColor: bg0, border: [false, false, false, false] },
                { text: formatCurrency(reports.totalRevenue), fontSize: 16, bold: true, color: gold, alignment: 'center', fillColor: bg0, border: [false, false, false, false] },
                { text: formatCurrency(reports.totalCollected), fontSize: 16, bold: true, color: '#4ac680', alignment: 'center', fillColor: bg0, border: [false, false, false, false] },
                { text: formatCurrency(reports.totalDebt), fontSize: 16, bold: true, color: '#e05c5c', alignment: 'center', fillColor: bg0, border: [false, false, false, false] },
              ],
            ],
          },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0.5, vLineColor: () => '#2a2a2a' },
          margin: [0, 0, 0, 20],
        },

        // Ventas por Mes
        { text: 'VENTAS POR MES', fontSize: 9, bold: true, color: gold, margin: [0, 0, 0, 6] },
        makeTable(
          ['*', 60, 80, 80],
          ['Mes', 'Ventas', 'Ingresos', 'Profit'],
          reports.salesByMonth.map((m, i) => [
            { text: new Date(m.month).toLocaleDateString('es-VE', { month: 'long', year: 'numeric' }), fontSize: 9, color: '#cccccc', fillColor: rowBg(i) },
            { text: String(m.sales_count), fontSize: 9, color: '#cccccc', alignment: 'center', fillColor: rowBg(i) },
            { text: formatCurrency(m.revenue), fontSize: 9, color: gold, alignment: 'right', fillColor: rowBg(i) },
            { text: formatCurrency(m.profit), fontSize: 9, color: '#4ac680', alignment: 'right', fillColor: rowBg(i) },
          ]),
        ),

        // Top Productos
        { text: 'TOP PRODUCTOS', fontSize: 9, bold: true, color: gold, margin: [0, 0, 0, 6] },
        makeTable(
          ['*', 40, 70, 55],
          ['Producto', 'Ventas', 'Ingresos', 'Margen %'],
          reports.topProducts.map((p, i) => [
            { text: p.name, fontSize: 9, color: '#cccccc', fillColor: rowBg(i) },
            { text: String(p.sales_count), fontSize: 9, color: '#cccccc', alignment: 'center', fillColor: rowBg(i) },
            { text: formatCurrency(p.revenue), fontSize: 9, color: gold, alignment: 'right', fillColor: rowBg(i) },
            { text: `${Number(p.avg_margin).toFixed(1)}%`, fontSize: 9, color: '#4ac680', alignment: 'right', fillColor: rowBg(i) },
          ]),
        ),

        // Top Clientes
        { text: 'TOP CLIENTES', fontSize: 9, bold: true, color: gold, margin: [0, 0, 0, 6] },
        makeTable(
          ['*', 40, 80],
          ['Cliente', 'Ventas', 'Facturado'],
          reports.topClients.map((c, i) => [
            { text: c.name, fontSize: 9, color: '#cccccc', fillColor: rowBg(i) },
            { text: String(c.salesCount), fontSize: 9, color: '#cccccc', alignment: 'center', fillColor: rowBg(i) },
            { text: formatCurrency(c.totalSpent), fontSize: 9, color: gold, alignment: 'right', fillColor: rowBg(i) },
          ]),
        ),

        // Métodos de Pago
        ...(reports.paymentsByMethod.length > 0 ? [
          { text: 'MÉTODOS DE PAGO', fontSize: 9, bold: true, color: gold, margin: [0, 0, 0, 6] },
          makeTable(
            ['*', 100, 80],
            ['Método', 'Total Cobrado', 'Transacciones'],
            reports.paymentsByMethod.map((p, i) => [
              { text: p.method, fontSize: 9, color: '#cccccc', fillColor: rowBg(i) },
              { text: formatCurrency(p.total), fontSize: 9, color: gold, alignment: 'right', fillColor: rowBg(i) },
              { text: String(p.count), fontSize: 9, color: '#cccccc', alignment: 'center', fillColor: rowBg(i) },
            ]),
          ),
        ] : []),

        // Margen por Producto
        ...(reports.marginByProduct.length > 0 ? [
          { text: 'MARGEN POR PRODUCTO', fontSize: 9, bold: true, color: gold, margin: [0, 0, 0, 6] },
          makeTable(
            ['*', 80],
            ['Producto', 'Margen %'],
            reports.marginByProduct.map((m, i) => [
              { text: m.name, fontSize: 9, color: '#cccccc', fillColor: rowBg(i) },
              { text: `${Number(m.avg_margin_pct).toFixed(1)}%`, fontSize: 9, color: gold, alignment: 'right', fillColor: rowBg(i) },
            ]),
            [0, 0, 0, 0],
          ),
        ] : []),
      ],
      defaultStyle: { font: 'Roboto', color: '#cccccc' },
    };

    pdfMake.createPdf(docDef).download(`reporte-persenso-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  const totalSalesCount = reports.salesByMonth.reduce((s, m) => s + m.sales_count, 0);
  const promedioVenta = totalSalesCount > 0 ? reports.totalRevenue / totalSalesCount : 0;
  const tasaCobranza = reports.totalRevenue > 0 ? (reports.totalCollected / reports.totalRevenue) * 100 : 0;

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
      <AdminPageHeader
        title="Reportes"
        subtitle="Métricas financieras del negocio"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}>
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}>
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        }
      />

      {/* Date filter */}
      <div className="card-persenso p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>Desde</label>
          <input type="date" value={startDate} max={endDate || undefined}
            onChange={(e) => handleStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>Hasta</label>
          <input type="date" value={endDate} min={startDate || undefined}
            onChange={(e) => handleEndDate(e.target.value)} style={inputStyle} />
        </div>
        {(startDate || endDate) && (
          <button onClick={handleClear} className="px-4 py-2 text-sm rounded-lg font-medium"
            style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
            Limpiar
          </button>
        )}
        {loading && <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Cargando…</span>}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Ventas del Período"
          value={String(totalSalesCount)}
          sub={`${formatCurrency(reports.totalRevenue)} facturado`}
          icon={ShoppingBag}
          color="gold"
        />
        <StatCard
          title="Valor Promedio por Venta"
          value={formatCurrency(promedioVenta)}
          sub="ingreso medio por venta"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Tasa de Cobranza"
          value={`${tasaCobranza.toFixed(1)}%`}
          sub={`${formatCurrency(reports.totalCollected)} cobrado`}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Deuda Total Clientes"
          value={formatCurrency(reports.totalDebt)}
          sub="saldo pendiente"
          icon={DollarSign}
          color="red"
        />
      </div>

      {/* Ventas por Mes */}
      <div className="card-persenso p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Ventas por Mes</h2>
        {reports.salesByMonth.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--ps-text-muted)' }}>Sin datos</p>
        ) : (
          <div className="space-y-3">
            {reports.salesByMonth.map((m) => (
              <div key={m.month} className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--ps-border)' }}>
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

      {/* Top Productos + Top Clientes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
        <div className="flex flex-col" style={{ minHeight: 360 }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Top Productos</h2>
          <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 360 }}>
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
          </div>
        </div>

        <div className="flex flex-col" style={{ minHeight: 360 }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Top Clientes</h2>
          <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 360 }}>
            <AdminDataTable
              data={reports.topClients}
              keyExtractor={(c) => c.clientId}
              emptyMessage="Sin datos de clientes"
              columns={[
                { key: 'name', header: 'Cliente', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
                { key: 'salesCount', header: 'Ventas', sortable: true, align: 'center' },
                { key: 'totalSpent', header: 'Facturado', sortable: true, align: 'right', render: (c) => <span style={{ color: 'var(--ps-gold)' }}>{formatCurrency(c.totalSpent)}</span> },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Métodos de Pago */}
      {reports.paymentsByMethod.length > 0 && (
        <div className="card-persenso p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Métodos de Pago</h2>
          <div className="space-y-3">
            {(() => {
              const maxTotal = Math.max(...reports.paymentsByMethod.map((p) => p.total));
              return reports.paymentsByMethod.map((p) => (
                <div key={p.method} className="flex items-center gap-4">
                  <span className="text-sm w-28 flex-shrink-0 font-medium" style={{ color: 'var(--ps-text)' }}>{p.method}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ps-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(p.total / maxTotal) * 100}%`, background: 'var(--ps-gold)' }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-24 text-right" style={{ color: 'var(--ps-gold)' }}>{formatCurrency(p.total)}</span>
                  <span className="text-xs w-16 text-right" style={{ color: 'var(--ps-text-muted)' }}>{p.count} transac.</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Margen por Producto */}
      {reports.marginByProduct.length > 0 && (
        <div className="card-persenso p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>Margen por Producto</h2>
          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 240 }}>
            {reports.marginByProduct.map((m) => (
              <div key={m.name} className="flex items-center gap-4">
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--ps-text)' }}>{m.name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ps-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(m.avg_margin_pct, 100)}%`, background: 'var(--ps-gold)' }} />
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
