'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const METHODS = ['efectivo', 'pago_movil', 'transferencia', 'zelle', 'binance'];

export function NewGastoDialog({ onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ source: '', method: 'efectivo', amount: '', date: today, notes: '' });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--ps-text)' }}>Registrar Gasto</h2>
          <button onClick={onClose} style={{ color: 'var(--ps-text-muted)' }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Fuente / Concepto *</label>
            <input required value={form.source} onChange={(e) => set('source', e.target.value)}
              placeholder="Ej: Proveedor, Alquiler, etc."
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Monto *</label>
              <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Fecha *</label>
              <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Método de pago *</label>
            <select value={form.method} onChange={(e) => set('method', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Notas</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--ps-red)' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, var(--ps-gold-dark), var(--ps-gold))', color: '#0d0d0f', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando…' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
