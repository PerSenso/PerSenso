'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { IdBadge } from '@/components/admin/IdBadge';
import type {
  TraceResult,
  Sale,
  Payment,
  RestockLine,
  OrderWithRestockProducts,
  RestockWithChain,
} from '@persenso/shared';
import {
  Search, User, Package, Layers, ShoppingCart,
  Truck, Wallet, GitBranch, AlertCircle, Loader2,
} from 'lucide-react';

interface TrazabilidadContentProps {
  initialId?: string;
}

function formatCurrency(n: number | string) {
  return `$${Number(n).toFixed(2)}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-VE');
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ps-text-muted)' }}>
      {children}
    </p>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>{label}</span>
      <span className="text-right font-medium" style={{ color: 'var(--ps-text)' }}>{value}</span>
    </div>
  );
}

function EntityHeader({
  icon: Icon, color, label, id, name,
}: { icon: React.ElementType; color: string; label: string; id: string; name: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>{label}</p>
          <IdBadge id={id} />
        </div>
        <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--ps-text)' }}>{name}</h2>
      </div>
    </div>
  );
}

function PaymentBadge({ method }: { method: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
      style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--ps-gold)' }}>
      {method}
    </span>
  );
}

function SaleStatus({ payments, total }: { payments?: Payment[]; total: number }) {
  const paid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const pending = Math.max(0, total - paid);
  if (pending === 0) return <span style={{ color: 'var(--ps-green)' }} className="font-semibold">Pagada</span>;
  if (paid === 0) return <span style={{ color: 'var(--ps-red)' }} className="font-semibold">Pendiente</span>;
  return <span style={{ color: 'var(--ps-gold)' }} className="font-semibold">Parcial ({formatCurrency(pending)} pendiente)</span>;
}

/**
 * Compact card that shows a sale + the full restock/order/supplier chain
 * underneath. Used in client and product results so each sale spells out
 * which lote/proveedor abasteció ese item — sin clicks adicionales.
 */
function SaleChainCard({ sale, hideClient, hideProduct }: { sale: Sale; hideClient?: boolean; hideProduct?: boolean }) {
  const restock = sale.restockSource;
  const order = restock?.order;
  const supplier = order?.supplier;
  const funding = order?.fundingEntries ?? [];

  return (
    <InfoCard>
      {/* Top row — venta core */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IdBadge id={sale.id} />
          {!hideClient && sale.client?.name && (
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ps-text)' }}>
              <User className="w-3 h-3 inline mr-1" style={{ color: 'var(--ps-text-muted)' }} />
              {sale.client.name}
            </span>
          )}
          {!hideProduct && sale.product?.name && (
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ps-text)' }}>
              <Package className="w-3 h-3 inline mr-1" style={{ color: 'var(--ps-text-muted)' }} />
              {sale.product.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <SaleStatus payments={sale.payments} total={Number(sale.total)} />
          <span className="font-semibold tabular-nums text-sm" style={{ color: 'var(--ps-gold)' }}>{formatCurrency(Number(sale.total))}</span>
          <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{formatDate(sale.date)}</span>
        </div>
      </div>

      {/* Chain row — lote → proveedor → financiadores */}
      {(restock || sale.unitCostAtSale != null) && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs pt-2 mt-2"
          style={{ borderTop: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}
        >
          {restock ? (
            <>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" style={{ color: 'var(--ps-gold)' }} />
                Lote
                <IdBadge id={restock.id} />
                <span>· {restock.quantity}u · {formatCurrency(Number(restock.baseUnitCost))}/u</span>
              </span>
              {order && (
                <span className="flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  Pedido
                  <IdBadge id={order.id} />
                </span>
              )}
              {supplier && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  {supplier.name}
                  <IdBadge id={supplier.id} />
                </span>
              )}
              {funding.length > 0 && (
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {funding.map((f) => f.investor).join(' · ')}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 italic">
              <Layers className="w-3 h-3" />
              Sin lote — costo por promedio ({sale.unitCostAtSale != null ? formatCurrency(Number(sale.unitCostAtSale)) : '—'})
            </span>
          )}
          {sale.profitAtSale != null && (
            <span style={{ color: Number(sale.profitAtSale) >= 0 ? 'var(--ps-green)' : 'var(--ps-red)' }}>
              Ganancia: {formatCurrency(Number(sale.profitAtSale))}
              {sale.marginPctAtSale != null && ` (${Number(sale.marginPctAtSale).toFixed(1)}%)`}
            </span>
          )}
        </div>
      )}
    </InfoCard>
  );
}

// ── Result renderers ─────────────────────────────────────────────────────────

function SaleResult({ sale }: { sale: Sale }) {
  const restock = sale.restockSource;
  const order = restock?.order;
  const paid = (sale.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const pending = Math.max(0, Number(sale.total) - paid);

  return (
    <div className="space-y-6">
      <EntityHeader icon={ShoppingCart} color="var(--ps-gold)" label="Venta" id={sale.id} name={`${formatCurrency(Number(sale.total))} — ${formatDate(sale.date)}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Venta */}
        <div>
          <SectionTitle>Datos de la venta</SectionTitle>
          <InfoCard>
            <Row label="Total" value={<span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(sale.total))}</span>} />
            <Row label="Pagado" value={<span style={{ color: 'var(--ps-green)' }}>{formatCurrency(paid)}</span>} />
            {pending > 0 && <Row label="Pendiente" value={<span style={{ color: 'var(--ps-red)' }}>{formatCurrency(pending)}</span>} />}
            {sale.profitAtSale != null && <Row label="Ganancia snapshot" value={<span style={{ color: Number(sale.profitAtSale) >= 0 ? 'var(--ps-green)' : 'var(--ps-red)' }}>{formatCurrency(Number(sale.profitAtSale))} {sale.marginPctAtSale != null && `(${Number(sale.marginPctAtSale).toFixed(1)}%)`}</span>} />}
            {sale.unitCostAtSale != null && <Row label="Costo (snapshot)" value={formatCurrency(Number(sale.unitCostAtSale))} />}
            {sale.notes && <Row label="Notas" value={sale.notes} />}
          </InfoCard>
        </div>

        {/* Cliente */}
        <div>
          <SectionTitle>Cliente</SectionTitle>
          <InfoCard>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{sale.client?.name ?? '—'}</span>
              <IdBadge id={sale.client?.id ?? sale.clientId} />
            </div>
            {sale.client?.phone && <Row label="Teléfono" value={sale.client.phone} />}
            {sale.client?.ci && <Row label="Cédula" value={sale.client.ci} />}
          </InfoCard>
        </div>

        {/* Producto */}
        <div>
          <SectionTitle>Producto</SectionTitle>
          <InfoCard>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{sale.product?.name ?? '—'}</span>
              <IdBadge id={sale.product?.id ?? sale.productId} />
            </div>
            {sale.product?.brand && <Row label="Marca" value={sale.product.brand} />}
          </InfoCard>
        </div>

        {/* Lote */}
        {restock ? (
          <div>
            <SectionTitle>Lote de origen</SectionTitle>
            <InfoCard>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--ps-text)' }}>Lote</span>
                <IdBadge id={restock.id} />
              </div>
              <Row label="Cantidad" value={`${restock.quantity} u.`} />
              <Row label="Costo base / u." value={formatCurrency(Number(restock.baseUnitCost))} />
              {order && <Row label="Pedido" value={<IdBadge id={order.id} />} />}
              {order?.supplier && <Row label="Proveedor" value={order.supplier.name} />}
            </InfoCard>
          </div>
        ) : (
          <div>
            <SectionTitle>Lote de origen</SectionTitle>
            <InfoCard>
              <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Sin lote asignado — costo por promedio</p>
            </InfoCard>
          </div>
        )}
      </div>

      {/* Pagos */}
      {(sale.payments?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>Historial de pagos</SectionTitle>
          <div className="space-y-2">
            {sale.payments!.map((p) => (
              <InfoCard key={p.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--ps-green)' }}>{formatCurrency(Number(p.amount))}</span>
                    <PaymentBadge method={p.paymentMethod} />
                    {p.isInitial && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)' }}>inicial</span>}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{formatDate(p.date)}</span>
                </div>
              </InfoCard>
            ))}
          </div>
        </div>
      )}

      {/* Financiadores del pedido */}
      {(order?.fundingEntries?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>Financiadores del pedido</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {order!.fundingEntries!.map((f) => (
              <InfoCard key={f.id}>
                <Row label={f.investor} value={<><span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(f.amount))}</span><span style={{ color: 'var(--ps-text-muted)' }}> · {f.method}</span></>} />
              </InfoCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientResult({ data }: { data: TraceResult & { type: 'client' } }) {
  const client = data.data;
  const totalCompra = client.sales.reduce((s, v) => s + Number(v.total), 0);
  const totalPagado = client.sales.reduce(
    (s, v) => s + (v.payments ?? []).reduce((a, p) => a + Number(p.amount), 0),
    0,
  );
  const totalDeuda = Math.max(0, totalCompra - totalPagado);

  // Productos y proveedores únicos vistos en el historial del cliente
  const uniqueProducts = new Map<string, { name: string; count: number }>();
  const uniqueSuppliers = new Map<string, { name: string; count: number }>();
  for (const s of client.sales) {
    if (s.product?.id) {
      const cur = uniqueProducts.get(s.product.id) ?? { name: s.product.name, count: 0 };
      cur.count++;
      uniqueProducts.set(s.product.id, cur);
    }
    const sup = s.restockSource?.order?.supplier;
    if (sup) {
      const cur = uniqueSuppliers.get(sup.id) ?? { name: sup.name, count: 0 };
      cur.count++;
      uniqueSuppliers.set(sup.id, cur);
    }
  }

  return (
    <div className="space-y-6">
      <EntityHeader icon={User} color="var(--ps-text-muted)" label="Cliente" id={client.id} name={client.name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle>Datos del cliente</SectionTitle>
          <InfoCard>
            {client.ci && <Row label="Cédula" value={client.ci} />}
            {client.phone && <Row label="Teléfono" value={client.phone} />}
            {client.address && <Row label="Dirección" value={client.address} />}
            {client.notes && <Row label="Notas" value={client.notes} />}
            <Row label="Registro" value={formatDate(client.createdAt)} />
          </InfoCard>
        </div>
        <div>
          <SectionTitle>Resumen financiero</SectionTitle>
          <InfoCard>
            <Row label="Ventas totales" value={client.sales.length} />
            <Row label="Total comprado" value={<span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(totalCompra)}</span>} />
            <Row label="Total pagado" value={<span style={{ color: 'var(--ps-green)' }}>{formatCurrency(totalPagado)}</span>} />
            <Row label="Deuda actual" value={<span style={{ color: totalDeuda > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' }} className="font-semibold">{formatCurrency(totalDeuda)}</span>} />
          </InfoCard>
        </div>
      </div>

      {/* Productos y proveedores asociados */}
      {(uniqueProducts.size > 0 || uniqueSuppliers.size > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {uniqueProducts.size > 0 && (
            <div>
              <SectionTitle>Productos comprados ({uniqueProducts.size})</SectionTitle>
              <InfoCard>
                <div className="flex flex-col gap-1.5">
                  {Array.from(uniqueProducts.entries()).map(([id, p]) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IdBadge id={id} />
                        <span style={{ color: 'var(--ps-text)' }}>{p.name}</span>
                      </div>
                      <span style={{ color: 'var(--ps-text-muted)' }}>{p.count}×</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}
          {uniqueSuppliers.size > 0 && (
            <div>
              <SectionTitle>Proveedores de origen ({uniqueSuppliers.size})</SectionTitle>
              <InfoCard>
                <div className="flex flex-col gap-1.5">
                  {Array.from(uniqueSuppliers.entries()).map(([id, s]) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IdBadge id={id} />
                        <span style={{ color: 'var(--ps-text)' }}>{s.name}</span>
                      </div>
                      <span style={{ color: 'var(--ps-text-muted)' }}>{s.count} venta{s.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      <div>
        <SectionTitle>Historial de ventas con cadena completa ({client.sales.length})</SectionTitle>
        <div className="space-y-2">
          {client.sales.map((s) => <SaleChainCard key={s.id} sale={s} hideClient />)}
          {client.sales.length === 0 && <p className="text-sm" style={{ color: 'var(--ps-text-muted)' }}>Sin ventas registradas</p>}
        </div>
      </div>
    </div>
  );
}

function ProductResult({ data }: { data: TraceResult & { type: 'product' } }) {
  const product = data.data;
  const sales = product.sales ?? [];

  // Suppliers únicos y clientes únicos detectados en los lotes/ventas
  const uniqueSuppliers = new Map<string, { name: string; lots: number }>();
  for (const r of product.restocks) {
    const sup = r.order?.supplier;
    if (sup) {
      const cur = uniqueSuppliers.get(sup.id) ?? { name: sup.name, lots: 0 };
      cur.lots++;
      uniqueSuppliers.set(sup.id, cur);
    }
  }

  const uniqueClients = new Map<string, { name: string; count: number }>();
  for (const s of sales) {
    if (s.client?.id) {
      const cur = uniqueClients.get(s.client.id) ?? { name: s.client.name, count: 0 };
      cur.count++;
      uniqueClients.set(s.client.id, cur);
    }
  }

  return (
    <div className="space-y-6">
      <EntityHeader icon={Package} color="var(--ps-text)" label="Producto" id={product.id} name={`${product.name}${product.brand ? ` — ${product.brand}` : ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle>Datos del producto</SectionTitle>
          <InfoCard>
            {product.brand && <Row label="Marca" value={product.brand} />}
            {product.size && <Row label="Tamaño" value={product.size} />}
            {product.gender && <Row label="Género" value={product.gender} />}
            <Row label="Costo actual" value={formatCurrency(Number(product.costPrice))} />
            <Row label="Precio venta" value={<span style={{ color: 'var(--ps-gold)' }}>{formatCurrency(Number(product.salePrice))}</span>} />
          </InfoCard>
        </div>
        <div>
          <SectionTitle>Stock & disponibilidad</SectionTitle>
          <InfoCard>
            <Row label="Stock actual" value={<span style={{ color: (product.stock ?? 0) <= (product.minStock ?? 2) ? 'var(--ps-red)' : 'var(--ps-green)' }} className="font-semibold">{product.stock ?? 0} u.</span>} />
            <Row label="Stock mínimo" value={product.minStock ?? 2} />
            <Row label="Lotes totales" value={product.restocks.length} />
            <Row label="Ventas totales" value={sales.length} />
            <Row label="Visible en tienda" value={product.isPublished ? 'Sí' : 'No'} />
          </InfoCard>
        </div>
      </div>

      {/* Proveedores y clientes asociados */}
      {(uniqueSuppliers.size > 0 || uniqueClients.size > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {uniqueSuppliers.size > 0 && (
            <div>
              <SectionTitle>Proveedores que abastecen ({uniqueSuppliers.size})</SectionTitle>
              <InfoCard>
                <div className="flex flex-col gap-1.5">
                  {Array.from(uniqueSuppliers.entries()).map(([id, s]) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IdBadge id={id} />
                        <span style={{ color: 'var(--ps-text)' }}>{s.name}</span>
                      </div>
                      <span style={{ color: 'var(--ps-text-muted)' }}>{s.lots} lote{s.lots !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}
          {uniqueClients.size > 0 && (
            <div>
              <SectionTitle>Clientes que lo compraron ({uniqueClients.size})</SectionTitle>
              <InfoCard>
                <div className="flex flex-col gap-1.5">
                  {Array.from(uniqueClients.entries()).map(([id, c]) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <IdBadge id={id} />
                        <span style={{ color: 'var(--ps-text)' }}>{c.name}</span>
                      </div>
                      <span style={{ color: 'var(--ps-text-muted)' }}>{c.count}×</span>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {/* Lotes detallados con su pedido, proveedor y ventas */}
      <div>
        <SectionTitle>Lotes de reposición ({product.restocks.length})</SectionTitle>
        <div className="space-y-2">
          {product.restocks.map((r) => {
            const lotSales = (r as RestockLine & { sales?: Sale[] }).sales ?? [];
            return (
              <InfoCard key={r.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <IdBadge id={r.id} />
                    <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{formatDate(r.createdAt)}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-sm" style={{ color: 'var(--ps-gold)' }}>{r.quantity} u. · {formatCurrency(Number(r.baseUnitCost))}/u</span>
                </div>
                {r.order && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-2 mt-1" style={{ borderTop: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Pedido <IdBadge id={r.order.id} />
                    </span>
                    {r.order.supplier && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {r.order.supplier.name}
                        <IdBadge id={r.order.supplier.id} />
                      </span>
                    )}
                    {r.order.shippingCost > 0 && <span>Envío: {formatCurrency(Number(r.order.shippingCost))}</span>}
                    {lotSales.length > 0 && <span>{lotSales.length} venta{lotSales.length !== 1 ? 's' : ''} desde este lote</span>}
                  </div>
                )}
              </InfoCard>
            );
          })}
          {product.restocks.length === 0 && <p className="text-sm" style={{ color: 'var(--ps-text-muted)' }}>Sin lotes registrados</p>}
        </div>
      </div>

      {/* Ventas del producto con cadena completa */}
      {sales.length > 0 && (
        <div>
          <SectionTitle>Ventas con cadena completa ({sales.length})</SectionTitle>
          <div className="space-y-2">
            {sales.map((s) => <SaleChainCard key={s.id} sale={s} hideProduct />)}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderResult({ data }: { data: TraceResult & { type: 'order' } }) {
  const order = data.data as OrderWithRestockProducts;
  const totalUnits = order.restocks.reduce((s, r) => s + r.quantity, 0);
  const totalCost = order.restocks.reduce((s, r) => s + r.quantity * Number(r.baseUnitCost), 0);

  return (
    <div className="space-y-6">
      <EntityHeader icon={ShoppingCart} color="var(--ps-text)" label="Pedido" id={order.id} name={`Pedido del ${formatDate(order.date)}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle>Datos del pedido</SectionTitle>
          <InfoCard>
            <Row label="Fecha" value={formatDate(order.date)} />
            {order.shippingCost > 0 && <Row label="Costo envío" value={formatCurrency(Number(order.shippingCost))} />}
            {order.marketingCost > 0 && <Row label="Costo marketing" value={formatCurrency(Number(order.marketingCost))} />}
            <Row label="Total unidades" value={`${totalUnits} u.`} />
            <Row label="Costo base total" value={<span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(totalCost)}</span>} />
            {order.notes && <Row label="Notas" value={order.notes} />}
          </InfoCard>
        </div>
        {order.supplier && (
          <div>
            <SectionTitle>Proveedor</SectionTitle>
            <InfoCard>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{order.supplier.name}</span>
                <IdBadge id={order.supplier.id} />
              </div>
              {order.supplier.phone && <Row label="Teléfono" value={order.supplier.phone} />}
            </InfoCard>
          </div>
        )}
      </div>

      {(order.fundingEntries?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>Financiadores</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {order.fundingEntries!.map((f) => (
              <InfoCard key={f.id}>
                <Row label={f.investor} value={<><span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(f.amount))}</span><span style={{ color: 'var(--ps-text-muted)' }}> · {f.method}</span></>} />
              </InfoCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Productos en este pedido ({order.restocks.length} lotes)</SectionTitle>
        <div className="space-y-2">
          {order.restocks.map((r) => {
            const sales = r.sales ?? [];
            return (
              <InfoCard key={r.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }} />
                    <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{r.product?.name ?? '—'}</span>
                    <IdBadge id={r.id} />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'var(--ps-text-muted)' }}>{r.quantity} u. · {formatCurrency(Number(r.baseUnitCost))}/u</span>
                    {sales.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--ps-gold)' }}>{sales.length} venta{sales.length !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </InfoCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RestockResult({ data }: { data: TraceResult & { type: 'restock' } }) {
  const r = data.data as RestockWithChain;
  return (
    <div className="space-y-6">
      <EntityHeader icon={Layers} color="var(--ps-gold)" label="Lote de reposición" id={r.id} name={`${r.product?.name ?? '—'} — ${r.quantity} u.`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle>Producto</SectionTitle>
          <InfoCard>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{r.product?.name ?? '—'}</span>
              {r.product && <IdBadge id={r.product.id} />}
            </div>
            {r.product?.brand && <Row label="Marca" value={r.product.brand} />}
          </InfoCard>
        </div>
        <div>
          <SectionTitle>Datos del lote</SectionTitle>
          <InfoCard>
            <Row label="Cantidad" value={`${r.quantity} u.`} />
            <Row label="Costo base / u." value={formatCurrency(Number(r.baseUnitCost))} />
            <Row label="Ingresado" value={formatDate(r.createdAt)} />
            {r.order && <Row label="Pedido" value={<IdBadge id={r.order.id} />} />}
          </InfoCard>
        </div>

        {r.order?.supplier && (
          <div>
            <SectionTitle>Proveedor</SectionTitle>
            <InfoCard>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{r.order.supplier.name}</span>
                <IdBadge id={r.order.supplier.id} />
              </div>
              {r.order.supplier.phone && <Row label="Teléfono" value={r.order.supplier.phone} />}
            </InfoCard>
          </div>
        )}

        {r.order && (
          <div>
            <SectionTitle>Pedido del lote</SectionTitle>
            <InfoCard>
              <Row label="Fecha" value={formatDate(r.order.date)} />
              {r.order.shippingCost > 0 && <Row label="Envío" value={formatCurrency(Number(r.order.shippingCost))} />}
              {r.order.marketingCost > 0 && <Row label="Marketing" value={formatCurrency(Number(r.order.marketingCost))} />}
            </InfoCard>
          </div>
        )}
      </div>

      {(r.order?.fundingEntries?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>Financiadores</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {r.order!.fundingEntries!.map((f) => (
              <InfoCard key={f.id}>
                <Row label={f.investor} value={<><span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(f.amount))}</span><span style={{ color: 'var(--ps-text-muted)' }}> · {f.method}</span></>} />
              </InfoCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Ventas de este lote ({(r.sales ?? []).length})</SectionTitle>
        <div className="space-y-2">
          {(r.sales ?? []).map((s) => (
            <InfoCard key={s.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IdBadge id={s.id} />
                  <span className="font-medium text-sm" style={{ color: 'var(--ps-text)' }}>{s.client?.name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <SaleStatus payments={s.payments} total={Number(s.total)} />
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--ps-gold)' }}>{formatCurrency(Number(s.total))}</span>
                  <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{formatDate(s.date)}</span>
                </div>
              </div>
            </InfoCard>
          ))}
          {(r.sales ?? []).length === 0 && <p className="text-sm" style={{ color: 'var(--ps-text-muted)' }}>Sin ventas desde este lote</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrazabilidadContent({ initialId }: TrazabilidadContentProps) {
  const router = useRouter();
  const [input, setInput] = useState(initialId ?? '');
  const [result, setResult] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (rawId: string) => {
    const id = rawId.trim().replace(/^#/, '');
    if (!id) return;

    // Validate UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
      setError('Formato inválido. Pega un UUID completo (ej: 6182ade8-b09c-4c0c-a59d-102b5cc38aff)');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    router.replace(`/admin/trazabilidad?id=${id}`, { scroll: false });

    try {
      const res = await fetch(`/api/admin/trace/${id}`);
      if (res.status === 404) {
        setError('ID no encontrado en ninguna entidad del sistema');
        return;
      }
      if (!res.ok) throw new Error();
      const data: TraceResult = await res.json();
      setResult(data);
    } catch {
      setError('Error al buscar el ID. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(input);
  };

  const typeLabel: Record<TraceResult['type'], string> = {
    sale: 'Venta', client: 'Cliente', product: 'Producto', order: 'Pedido', restock: 'Lote',
  };
  const typeIcon: Record<TraceResult['type'], React.ElementType> = {
    sale: ShoppingCart, client: User, product: Package, order: ShoppingCart, restock: Layers,
  };

  return (
    <>
      <AdminPageHeader
        title="Trazabilidad"
        subtitle="Busca cualquier entidad por su ID para ver su cadena completa"
      />

      {/* Buscador */}
      <div className="card-persenso p-5 mb-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--ps-text-muted)' }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pega un UUID completo — ej: 6182ade8-b09c-4c0c-a59d-102b5cc38aff"
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm font-mono"
              style={{
                background: 'var(--ps-input-bg)',
                border: '1px solid var(--ps-input-border)',
                color: 'var(--ps-input-text)',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-gold px-6 py-3 text-sm font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </form>

        {/* Hint pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {([
            { label: 'Venta', icon: ShoppingCart },
            { label: 'Cliente', icon: User },
            { label: 'Producto', icon: Package },
            { label: 'Lote', icon: Layers },
            { label: 'Pedido', icon: Truck },
          ] as const).map(({ label, icon: Icon }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}>
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ))}
          <span className="text-[10px]" style={{ color: 'var(--ps-text-muted)' }}>
            — el sistema detecta el tipo automáticamente
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card-persenso p-4 mb-6 flex items-center gap-3" style={{ borderColor: 'var(--ps-red)' }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ps-red)' }} />
          <p className="text-sm" style={{ color: 'var(--ps-red)' }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card-persenso p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--ps-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--ps-text-muted)' }}>Buscando en todas las entidades…</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card-persenso p-5">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid var(--ps-border)' }}>
            {(() => {
              const Icon = typeIcon[result.type];
              return (
                <>
                  <Icon className="w-4 h-4" style={{ color: 'var(--ps-gold)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                    Encontrado como: {typeLabel[result.type]}
                  </span>
                </>
              );
            })()}
          </div>

          {result.type === 'sale'    && <SaleResult sale={result.data} />}
          {result.type === 'client'  && <ClientResult data={result as TraceResult & { type: 'client' }} />}
          {result.type === 'product' && <ProductResult data={result as TraceResult & { type: 'product' }} />}
          {result.type === 'order'   && <OrderResult data={result as TraceResult & { type: 'order' }} />}
          {result.type === 'restock' && <RestockResult data={result as TraceResult & { type: 'restock' }} />}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="card-persenso p-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <GitBranch className="w-7 h-7" style={{ color: 'var(--ps-gold)' }} />
          </div>
          <div className="text-center">
            <p className="font-display text-base font-semibold mb-1" style={{ color: 'var(--ps-text)' }}>
              Pega un ID para comenzar
            </p>
            <p className="text-sm max-w-sm" style={{ color: 'var(--ps-text-muted)' }}>
              Copia cualquier badge <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--ps-gold)' }}>#XXXXXX</span> de las tablas y pega el UUID completo aquí.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
