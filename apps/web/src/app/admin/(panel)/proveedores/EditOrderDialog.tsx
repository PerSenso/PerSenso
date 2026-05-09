'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { Order, Supplier } from '@persenso/shared';

interface EditOrderDialogProps {
  order: Order;
  suppliers: Supplier[];
  onClose: () => void;
}

export function EditOrderDialog({ order, suppliers, onClose }: EditOrderDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: order.date.split('T')[0],
    supplierId: order.supplierId ?? '',
    shippingCost: String(Number(order.shippingCost).toFixed(2)),
    marketingCost: String(Number(order.marketingCost).toFixed(2)),
    notes: order.notes ?? '',
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Pedido actualizado');
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Pedido" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <textarea rows={3} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} style={fieldStyle} />
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
