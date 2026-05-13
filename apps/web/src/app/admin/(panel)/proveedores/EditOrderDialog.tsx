'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { Order, Supplier, ProductAdmin } from '@persenso/shared';

interface EditOrderDialogProps {
  order: Order;
  suppliers: Supplier[];
  products: ProductAdmin[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface RestockLine {
  productId: string;
  quantity: string;
  baseUnitCost: string;
}

function ProductCombobox({
  products,
  value,
  onChange,
}: {
  products: ProductAdmin[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = products.find((p) => p.id === value);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q);
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (p: ProductAdmin) => { onChange(p.id); setOpen(false); setSearch(''); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(''); setSearch(''); };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => { setOpen((o) => !o); if (!open) setSearch(''); }}
        className={`${fieldCls} flex items-center justify-between gap-2 cursor-pointer select-none`}
        style={fieldStyle}
      >
        <span className="truncate text-sm" style={{ color: selected ? 'var(--ps-text)' : 'var(--ps-text-muted)' }}>
          {selected ? `${selected.name}${selected.brand ? ` · ${selected.brand}` : ''}` : '— Seleccionar —'}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <button type="button" onClick={clear} className="p-0.5 rounded" style={{ color: 'var(--ps-text-muted)' }}>
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--ps-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
          style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div className="p-2" style={{ borderBottom: '1px solid var(--ps-border)' }}>
            <input
              autoFocus
              placeholder="Buscar perfume…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md outline-none"
              style={{ background: 'var(--ps-input-bg)', color: 'var(--ps-text)', border: '1px solid var(--ps-input-border)' }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--ps-text-muted)' }}>Sin resultados</p>
            ) : (
              filtered.map((p) => (
                <button key={p.id} type="button" onClick={() => select(p)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{ color: p.id === value ? 'var(--ps-gold)' : 'var(--ps-text)', background: p.id === value ? 'rgba(201,168,76,0.08)' : 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = p.id === value ? 'rgba(201,168,76,0.08)' : 'transparent'; }}
                >
                  <span className="font-medium">{p.name}</span>
                  {p.brand && <span className="ml-1 text-xs" style={{ color: 'var(--ps-text-muted)' }}>· {p.brand}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EditOrderDialog({ order, suppliers, products, onClose, onSuccess }: EditOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: order.date.split('T')[0],
    supplierId: order.supplierId ?? '',
    shippingCost: String(Number(order.shippingCost).toFixed(2)),
    marketingCost: String(Number(order.marketingCost).toFixed(2)),
    notes: order.notes ?? '',
  });

  const [restocks, setRestocks] = useState<RestockLine[]>(
    (order.restocks ?? []).length > 0
      ? (order.restocks ?? []).map((r) => ({
          productId: r.productId,
          quantity: String(r.quantity),
          baseUnitCost: String(Number(r.baseUnitCost).toFixed(2)),
        }))
      : [{ productId: '', quantity: '', baseUnitCost: '' }],
  );

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setRestock = (idx: number, field: keyof RestockLine, value: string) =>
    setRestocks((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const addRestock = () =>
    setRestocks((prev) => [...prev, { productId: '', quantity: '', baseUnitCost: '' }]);

  const removeRestock = (idx: number) =>
    setRestocks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restocks.some((r) => !r.productId || !r.quantity || !r.baseUnitCost)) {
      toast.error('Completa todas las líneas de producto');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(form.date).toISOString(),
          supplierId: form.supplierId || undefined,
          shippingCost: Number(form.shippingCost),
          marketingCost: Number(form.marketingCost),
          notes: form.notes || undefined,
          restocks: restocks.map((r) => ({
            productId: r.productId,
            quantity: Number(r.quantity),
            baseUnitCost: Number(r.baseUnitCost),
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message ?? 'Error al actualizar el pedido');
      }
      toast.success('Pedido actualizado');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Pedido" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Fecha *</label>
            <input type="date" required value={form.date} onChange={set('date')} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Proveedor</label>
            <select value={form.supplierId} onChange={set('supplierId')} className={fieldCls} style={fieldStyle}>
              <option value="">— Sin proveedor —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Costo de envío ($)</label>
            <input type="number" step="0.01" min="0" value={form.shippingCost} onChange={set('shippingCost')} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Costo marketing ($)</label>
            <input type="number" step="0.01" min="0" value={form.marketingCost} onChange={set('marketingCost')} className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Notas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} style={fieldStyle} />
        </div>

        {/* Productos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
              Productos *
            </p>
            <button type="button" onClick={addRestock}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--ps-gold)', background: 'rgba(201,168,76,0.1)' }}>
              <Plus className="w-3 h-3" /> Agregar línea
            </button>
          </div>

          <div className="space-y-2">
            {restocks.map((r, idx) => {
              const subtotal = (Number(r.quantity) || 0) * (Number(r.baseUnitCost) || 0);
              return (
                <div key={idx} className="grid gap-2 items-end"
                  style={{ gridTemplateColumns: '1fr 72px 96px 88px 32px' }}>
                  <div>
                    {idx === 0 && <p className="text-[10px] mb-1" style={{ color: 'var(--ps-text-muted)' }}>Producto</p>}
                    <ProductCombobox
                      products={products}
                      value={r.productId}
                      onChange={(id) => setRestock(idx, 'productId', id)}
                    />
                  </div>
                  <div>
                    {idx === 0 && <p className="text-[10px] mb-1" style={{ color: 'var(--ps-text-muted)' }}>Cant.</p>}
                    <input type="number" min="1" step="1" placeholder="0"
                      value={r.quantity} onChange={(e) => setRestock(idx, 'quantity', e.target.value)}
                      className={fieldCls} style={fieldStyle} />
                  </div>
                  <div>
                    {idx === 0 && <p className="text-[10px] mb-1" style={{ color: 'var(--ps-text-muted)' }}>Costo u. ($)</p>}
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={r.baseUnitCost} onChange={(e) => setRestock(idx, 'baseUnitCost', e.target.value)}
                      className={fieldCls} style={fieldStyle} />
                  </div>
                  <div>
                    {idx === 0 && <p className="text-[10px] mb-1" style={{ color: 'var(--ps-text-muted)' }}>Subtotal</p>}
                    <div className={`${fieldCls} tabular-nums`}
                      style={{ ...fieldStyle, color: subtotal > 0 ? 'var(--ps-gold)' : 'var(--ps-text-muted)' }}>
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeRestock(idx)}
                    disabled={restocks.length === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                    style={{ color: 'var(--ps-red)', background: 'rgba(224,92,92,0.1)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Total */}
          {(() => {
            const subtotalProductos = restocks.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.baseUnitCost) || 0), 0);
            const shipping = Number(form.shippingCost) || 0;
            const marketing = Number(form.marketingCost) || 0;
            const total = subtotalProductos + shipping + marketing;
            return (
              <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--ps-border)' }}>
                <div className="flex justify-between text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                  <span>Subtotal productos</span><span className="tabular-nums">${subtotalProductos.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    <span>Envío</span><span className="tabular-nums">${shipping.toFixed(2)}</span>
                  </div>
                )}
                {marketing > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    <span>Marketing</span><span className="tabular-nums">${marketing.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1"
                  style={{ borderTop: '1px solid var(--ps-border)', color: 'var(--ps-gold)' }}>
                  <span>Total pedido</span><span className="tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 btn-gold py-2.5 text-sm font-bold uppercase tracking-widest disabled:opacity-50">
            {loading ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
