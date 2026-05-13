'use client';

import React from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import type { Supplier, Order, OrderKpis, ProductAdmin } from '@persenso/shared';
import {
  Plus, Truck, Pencil, ChevronDown, ChevronUp,
  ShoppingBag, BarChart3, DollarSign, Filter, ChevronRight,
} from 'lucide-react';
import { IdBadge } from '@/components/admin/IdBadge';
import { NotaCell } from '@/components/admin/NotaCell';
import { useState, useEffect, useCallback } from 'react';
import { NewProveedorDialog } from './NewProveedorDialog';
import { EditProveedorDialog } from './EditProveedorDialog';
import { EditOrderDialog } from './EditOrderDialog';
import { NewOrderDialog } from './NewOrderDialog';

interface ProveedoresContentProps {
  suppliers: Supplier[];
  products: ProductAdmin[];
}

function formatCurrency(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function orderTotal(order: Order): number {
  const funding = (order.fundingEntries ?? []).reduce((s, f) => s + Number(f.amount), 0);
  return Number(order.shippingCost) + Number(order.marketingCost) + funding;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}
function KpiCard({ icon, label, value }: KpiCardProps) {
  return (
    <div className="flex-1 rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--ps-gold)' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--ps-text-muted)' }}>{label}</p>
        <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--ps-text)' }}>{value}</p>
      </div>
    </div>
  );
}

export function ProveedoresContent({ suppliers, products }: ProveedoresContentProps) {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [suppliersExpanded, setSuppliersExpanded] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [kpis, setKpis] = useState<OrderKpis | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedSupplierId) params.set('supplierId', selectedSupplierId);
      const q = params.toString();

      const [ordersRes, kpisRes] = await Promise.all([
        fetch(`/api/admin/orders${q ? `?${q}` : ''}`),
        fetch(`/api/admin/orders/kpis${q ? `?${q}` : ''}`),
      ]);
      const [ordersData, kpisData] = await Promise.all([
        ordersRes.json(),
        kpisRes.json(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setKpis(kpisData);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [startDate, endDate, selectedSupplierId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSupplierId('');
  };

  const hasFilters = startDate || endDate || selectedSupplierId;

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos · ${suppliers.length} proveedores`}
        actions={
          <button onClick={() => setShowNewOrder(true)}
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        }
      />

      {showNewOrder && (
        <NewOrderDialog suppliers={suppliers} products={products} onClose={() => setShowNewOrder(false)} />
      )}
      {showNewSupplier && (
        <NewProveedorDialog onClose={() => setShowNewSupplier(false)} />
      )}
      {editingSupplier && (
        <EditProveedorDialog supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />
      )}
      {editingOrder && (
        <EditOrderDialog order={editingOrder} suppliers={suppliers} onClose={() => setEditingOrder(null)} />
      )}

      {/* ── Pedidos (main feature) ── */}
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
          <Filter className="w-4 h-4 mt-5 flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ps-text-muted)' }}>Desde</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-text)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ps-text-muted)' }}>Hasta</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-text)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ps-text-muted)' }}>Proveedor</label>
            <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-text)' }}>
              <option value="">Todos</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium mt-auto"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}>
              Limpiar
            </button>
          )}
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="flex gap-3">
            <KpiCard icon={<ShoppingBag className="w-4 h-4" />} label="Pedidos" value={String(kpis.totalOrders)} />
            <KpiCard icon={<BarChart3 className="w-4 h-4" />} label="Unidades ingresadas" value={String(kpis.totalUnits)} />
            <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Total invertido" value={formatCurrency(kpis.totalInvested)} />
          </div>
        )}

        {/* Orders table */}
        {loadingOrders ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--ps-text-muted)' }}>Cargando pedidos…</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--ps-text-muted)' }}>No hay pedidos registrados</div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ps-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--ps-surface)', borderBottom: '1px solid var(--ps-border)' }}>
                  {['Fecha', 'Proveedor', 'Total invertido', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => {
                  const isExpanded = expandedOrderId === order.id;
                  const total = orderTotal(order);
                  const supplierName = order.supplierId
                    ? supplierMap.get(order.supplierId) ?? 'Desconocido'
                    : 'Sin proveedor';

                  return (
                    <React.Fragment key={order.id}>
                      <tr style={{
                        background: isExpanded ? 'rgba(201,168,76,0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid var(--ps-border)',
                      }}>
                        <td className="px-4 py-3" style={{ color: 'var(--ps-text)' }}>
                          {new Date(order.date).toLocaleDateString('es-VE')}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--ps-text)' }}>{supplierName}</td>
                        <td className="px-4 py-3 tabular-nums font-medium" style={{ color: 'var(--ps-gold)' }}>
                          {formatCurrency(total)}
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2 justify-end">
                          <button onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                            title="Editar pedido">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: isExpanded ? 'rgba(201,168,76,0.12)' : 'var(--ps-surface)',
                              color: isExpanded ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
                              border: '1px solid var(--ps-border)',
                            }}>
                            {isExpanded ? <><ChevronUp className="w-3 h-3" /> Colapsar</> : <><ChevronDown className="w-3 h-3" /> Ver detalle</>}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${order.id}-detail`}
                          style={{ background: 'rgba(201,168,76,0.03)', borderBottom: '1px solid var(--ps-border)' }}>
                          <td colSpan={4} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                                  style={{ color: 'var(--ps-text-muted)' }}>Productos del lote</p>
                                {(order.restocks ?? []).length === 0 ? (
                                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>Sin líneas</p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr>
                                        {['Producto', 'Cant.', 'Costo u.'].map((h) => (
                                          <th key={h} className="text-left pb-1 font-medium"
                                            style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(order.restocks ?? []).map((r) => (
                                        <tr key={r.id}>
                                          <td className="py-0.5" style={{ color: 'var(--ps-text)' }}>{r.product?.name ?? '—'}</td>
                                          <td className="py-0.5 tabular-nums" style={{ color: 'var(--ps-text)' }}>{r.quantity}u</td>
                                          <td className="py-0.5 tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>{formatCurrency(Number(r.baseUnitCost))}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                                  style={{ color: 'var(--ps-text-muted)' }}>Aporte por socio</p>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr>
                                      {['Socio / Concepto', 'Método', 'Monto'].map((h) => (
                                        <th key={h} className="text-left pb-1 font-medium"
                                          style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(order.fundingEntries ?? []).length === 0 ? (
                                      <tr>
                                        <td colSpan={3} className="py-1 text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                                          Sin aportes registrados
                                        </td>
                                      </tr>
                                    ) : (
                                      (order.fundingEntries ?? []).map((f) => (
                                        <tr key={f.id}>
                                          <td className="py-0.5 font-medium" style={{ color: 'var(--ps-text)' }}>{f.investor}</td>
                                          <td className="py-0.5 capitalize" style={{ color: 'var(--ps-text-muted)' }}>{f.method}</td>
                                          <td className="py-0.5 tabular-nums" style={{ color: 'var(--ps-gold)' }}>{formatCurrency(Number(f.amount))}</td>
                                        </tr>
                                      ))
                                    )}
                                    {(Number(order.shippingCost) > 0 || Number(order.marketingCost) > 0) && (
                                      <>
                                        {Number(order.shippingCost) > 0 && (
                                          <tr>
                                            <td className="py-0.5" style={{ color: 'var(--ps-text-muted)' }}>Envío</td>
                                            <td className="py-0.5" style={{ color: 'var(--ps-text-muted)' }}>—</td>
                                            <td className="py-0.5 tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>{formatCurrency(Number(order.shippingCost))}</td>
                                          </tr>
                                        )}
                                        {Number(order.marketingCost) > 0 && (
                                          <tr>
                                            <td className="py-0.5" style={{ color: 'var(--ps-text-muted)' }}>Marketing</td>
                                            <td className="py-0.5" style={{ color: 'var(--ps-text-muted)' }}>—</td>
                                            <td className="py-0.5 tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>{formatCurrency(Number(order.marketingCost))}</td>
                                          </tr>
                                        )}
                                      </>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {order.notes && (
                              <p className="mt-3 text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                                <span className="font-semibold">Notas: </span>{order.notes}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Proveedores (secondary section) ── */}
      <div className="mt-10">
        <button
          onClick={() => setSuppliersExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" style={{ color: 'var(--ps-text-muted)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--ps-text)' }}>
              Proveedores
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--ps-gold)' }}>
              {suppliers.length}
            </span>
          </div>
          <ChevronRight
            className="w-4 h-4 transition-transform"
            style={{
              color: 'var(--ps-text-muted)',
              transform: suppliersExpanded ? 'rotate(90deg)' : 'none',
            }}
          />
        </button>

        {suppliersExpanded && (
          <div className="mt-3 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setShowNewSupplier(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--ps-gold)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <Plus className="w-3.5 h-3.5" /> Nuevo Proveedor
              </button>
            </div>
            <AdminDataTable
              data={suppliers}
              keyExtractor={(s) => s.id}
              emptyMessage="No hay proveedores registrados"
              searchable
              searchPlaceholder="Buscar por nombre o teléfono…"
              searchKeys={['name', 'phone', 'email', 'notes']}
              columns={[
                { key: '_id', header: 'ID', render: (s) => <IdBadge id={s.id} /> },
                {
                  key: 'name', header: 'Nombre', sortable: true,
                  render: (s) => <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{s.name}</span>,
                },
                { key: 'phone', header: 'Teléfono', render: (s) => s.phone || '—' },
                {
                  key: 'email', header: 'Email',
                  render: (s) => s.email
                    ? <a href={`mailto:${s.email}`} className="text-xs hover:underline" style={{ color: 'var(--ps-gold)' }}>{s.email}</a>
                    : '—',
                },
                { key: 'notes', header: 'Notas', render: (s) => <NotaCell text={s.notes} /> },
                {
                  key: 'createdAt', header: 'Registro', sortable: true,
                  render: (s) => new Date(s.createdAt).toLocaleDateString('es-VE'),
                },
                {
                  key: '_actions', header: '',
                  render: (s) => (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSupplier(s); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
                      title="Editar proveedor">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    </>
  );
}
