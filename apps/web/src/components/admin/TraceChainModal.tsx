'use client';

import { AdminModal } from '@/components/admin/AdminModal';
import { IdBadge } from '@/components/admin/IdBadge';
import { formatId } from '@/lib/id-format';
import type { Sale } from '@persenso/shared';
import { User, Package, Layers, ShoppingCart, Truck, Wallet } from 'lucide-react';

interface TraceChainModalProps {
  sale: Sale;
  onClose: () => void;
}

function formatCurrency(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
        {label}
      </span>
      <span className="text-sm text-right" style={{ color: 'var(--ps-text)' }}>{value}</span>
    </div>
  );
}

function ChainStep({
  icon: Icon,
  color,
  label,
  id,
  children,
  connector = true,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  id?: string;
  children: React.ReactNode;
  connector?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        {connector && (
          <div className="flex-1 w-px mt-1" style={{ background: 'var(--ps-border)', minHeight: 12 }} />
        )}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
            {label}
          </span>
          {id && <IdBadge id={id} />}
        </div>
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function TraceChainModal({ sale, onClose }: TraceChainModalProps) {
  const restock = sale.restockSource;
  const order = restock?.order;
  const supplier = order?.supplier;
  const funding = order?.fundingEntries ?? [];

  const paid = (sale.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const pending = Math.max(0, Number(sale.total) - paid);

  return (
    <AdminModal
      title={`Trazabilidad — Venta ${formatId(sale.id)}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-0">
        {/* CLIENTE */}
        <ChainStep icon={User} color="var(--ps-text-muted)" label="Cliente" id={sale.client?.id ?? sale.clientId}>
          <Row label="Nombre" value={sale.client?.name ?? '—'} />
          {sale.client?.phone && <Row label="Teléfono" value={sale.client.phone} />}
          {sale.client?.ci && <Row label="Cédula" value={sale.client.ci} />}
        </ChainStep>

        {/* PRODUCTO */}
        <ChainStep icon={Package} color="var(--ps-text)" label="Producto" id={sale.product?.id ?? sale.productId}>
          <Row label="Nombre" value={sale.product?.name ?? '—'} />
          {sale.product?.brand && <Row label="Marca" value={sale.product.brand} />}
          {sale.unitCostAtSale != null && (
            <Row label="Costo (snapshot)" value={formatCurrency(Number(sale.unitCostAtSale))} />
          )}
        </ChainStep>

        {/* VENTA */}
        <ChainStep icon={ShoppingCart} color="var(--ps-gold)" label="Venta" id={sale.id}>
          <Row label="Fecha" value={new Date(sale.date).toLocaleDateString('es-VE')} />
          <Row label="Total" value={<span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(sale.total))}</span>} />
          <Row label="Pagado" value={<span style={{ color: 'var(--ps-green)' }}>{formatCurrency(paid)}</span>} />
          {pending > 0 && <Row label="Pendiente" value={<span style={{ color: 'var(--ps-red)' }}>{formatCurrency(pending)}</span>} />}
          {sale.profitAtSale != null && (
            <Row label="Ganancia" value={
              <span style={{ color: Number(sale.profitAtSale) >= 0 ? 'var(--ps-green)' : 'var(--ps-red)' }}>
                {formatCurrency(Number(sale.profitAtSale))}
                {sale.marginPctAtSale != null && ` (${Number(sale.marginPctAtSale).toFixed(1)}%)`}
              </span>
            } />
          )}
        </ChainStep>

        {/* LOTE */}
        {restock ? (
          <ChainStep icon={Layers} color="var(--ps-gold)" label="Lote de origen" id={restock.id}>
            <Row label="Cantidad" value={`${restock.quantity} u.`} />
            <Row label="Costo base / u." value={formatCurrency(Number(restock.baseUnitCost))} />
            {order && <Row label="Pedido" value={<IdBadge id={order.id} />} />}
          </ChainStep>
        ) : (
          <ChainStep icon={Layers} color="var(--ps-border)" label="Lote de origen" connector={false}>
            <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Sin lote asignado — costo calculado por promedio</p>
          </ChainStep>
        )}

        {/* PEDIDO */}
        {order && (
          <ChainStep icon={ShoppingCart} color="var(--ps-text)" label="Pedido" id={order.id}>
            <Row label="Fecha" value={new Date(order.date).toLocaleDateString('es-VE')} />
            {order.shippingCost > 0 && <Row label="Envío" value={formatCurrency(Number(order.shippingCost))} />}
            {order.marketingCost > 0 && <Row label="Marketing" value={formatCurrency(Number(order.marketingCost))} />}
            {order.notes && <Row label="Notas" value={order.notes} />}
          </ChainStep>
        )}

        {/* PROVEEDOR */}
        {supplier ? (
          <ChainStep icon={Truck} color="var(--ps-text-muted)" label="Proveedor" id={supplier.id} connector={funding.length > 0}>
            <Row label="Nombre" value={supplier.name} />
            {supplier.phone && <Row label="Teléfono" value={supplier.phone} />}
          </ChainStep>
        ) : order ? (
          <ChainStep icon={Truck} color="var(--ps-border)" label="Proveedor" connector={funding.length > 0}>
            <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Sin proveedor registrado</p>
          </ChainStep>
        ) : null}

        {/* FINANCIADORES */}
        {funding.length > 0 && (
          <ChainStep icon={Wallet} color="var(--ps-gold)" label="Financiadores" connector={false}>
            {funding.map((f) => (
              <Row
                key={f.id}
                label={f.investor}
                value={
                  <span>
                    <span style={{ color: 'var(--ps-gold)' }} className="font-semibold">{formatCurrency(Number(f.amount))}</span>
                    <span style={{ color: 'var(--ps-text-muted)' }}> · {f.method}</span>
                  </span>
                }
              />
            ))}
          </ChainStep>
        )}
      </div>
    </AdminModal>
  );
}
