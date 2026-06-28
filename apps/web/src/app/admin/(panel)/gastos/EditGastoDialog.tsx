'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { CashMovement } from '@persenso/shared';

interface Props {
  movement: CashMovement;
  socios: string[];
  onClose: () => void;
}

const METHODS = [
  { value: 'efectivo',   label: 'Efectivo' },
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'zelle',      label: 'Zelle' },
  { value: 'usdt',       label: 'USDT' },
];

export function EditGastoDialog({ movement, socios, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    source: movement.source,
    method: movement.method,
    amount: String(Number(movement.amount)),
    date: new Date(movement.date).toISOString().split('T')[0],
    notes: movement.notes ?? '',
    owner: movement.owner ?? '',
    paymentMethod: movement.paymentMethod ?? '',
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        source: form.source,
        method: form.method,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
      };
      if (form.notes) body.notes = form.notes;
      if (form.owner) body.owner = form.owner;
      if (form.paymentMethod) body.paymentMethod = form.paymentMethod;

      const res = await fetch(`/api/admin/movements/${movement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? 'Error al actualizar');
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminModal title="Editar Gasto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Fuente / Concepto *</label>
          <input required value={form.source} onChange={(e) => set('source', e.target.value)}
            className={fieldCls} style={fieldStyle} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Monto ($) *</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Fecha *</label>
            <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Método de pago *</label>
          <select value={form.method} onChange={(e) => set('method', e.target.value)}
            className={fieldCls} style={fieldStyle}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>¿Quién? (Socio)</label>
          <select value={form.owner} onChange={(e) => set('owner', e.target.value)}
            className={fieldCls} style={fieldStyle}>
            <option value="">— Sin asignar —</option>
            {socios.map((s) => <option key={s} value={s}>{s}</option>)}
            {/* Si el valor actual no está en la lista, mostrarlo igual */}
            {form.owner && !socios.includes(form.owner) && (
              <option value={form.owner}>{form.owner}</option>
            )}
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Notas</label>
          <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none" style={fieldStyle} />
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--ps-red)' }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="btn-gold flex-1 py-2.5 text-sm font-semibold disabled:opacity-60">
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
