'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';

interface Props {
  socios: string[];
  onClose: () => void;
}

const METHODS = ['efectivo', 'pago_movil', 'zelle', 'usdt'];

export function NewGastoDialog({ socios, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ source: '', method: 'efectivo', amount: '', date: today, notes: '', owner: '' });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'retiro',
          source: form.source,
          method: form.method,
          amount: parseFloat(form.amount),
          date: new Date(form.date).toISOString(),
          notes: form.notes || undefined,
          owner: form.owner || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Error al registrar gasto'); }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar gasto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminModal title="Registrar Gasto" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Fuente / Concepto *</label>
          <input required value={form.source} onChange={(e) => set('source', e.target.value)}
            placeholder="Ej: Reposición inventario, Envío, Publicidad…"
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
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>¿Quién? (Socio)</label>
          <select value={form.owner} onChange={(e) => set('owner', e.target.value)}
            className={fieldCls} style={fieldStyle}>
            <option value="">— Sin asignar —</option>
            {socios.map((s) => <option key={s} value={s}>{s}</option>)}
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
            {loading ? 'Guardando…' : 'Registrar Gasto'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
