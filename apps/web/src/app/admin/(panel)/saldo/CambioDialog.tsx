'use client';

import { useState } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const METHODS = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'zelle',         label: 'Zelle' },
  { value: 'pago_movil',    label: 'Pago Móvil' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'usdt',          label: 'USDT' },
  { value: 'dolares',       label: 'Dólares' },
  { value: 'binance',       label: 'Binance' },
];

interface CambioDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CambioDialog({ onClose, onSuccess }: CambioDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    amount: '',
    fromMethod: 'usdt',
    toMethod: 'efectivo',
    date: today,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.amount || !form.fromMethod || !form.toMethod) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    if (form.fromMethod === form.toMethod) {
      toast.error('El método origen y destino deben ser distintos');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          fromMethod: form.fromMethod,
          toMethod: form.toMethod,
          date: new Date(form.date).toISOString(),
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Cambio registrado correctamente');
      onSuccess();
      onClose();
    } catch {
      toast.error('Error al registrar el cambio');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg text-sm outline-none';
  const inputStyle = {
    background: 'var(--ps-input-bg)',
    border: '1px solid var(--ps-border)',
    color: 'var(--ps-input-text)',
  };
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest mb-1 block';

  const fromLabel = METHODS.find((m) => m.value === form.fromMethod)?.label ?? form.fromMethod;
  const toLabel = METHODS.find((m) => m.value === form.toMethod)?.label ?? form.toMethod;

  return (
    <AdminModal title="Registrar Cambio de Divisa" onClose={onClose}>
      <div className="space-y-4">

        {/* Preview del cambio */}
        {form.amount && (
          <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg"
            style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{fromLabel}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--ps-red)' }}>
                -${Number(form.amount).toFixed(2)}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ps-gold)' }} />
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{toLabel}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--ps-green)' }}>
                +${Number(form.amount).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Monto */}
        <div>
          <label className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>Monto *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        {/* De → A */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>De (origen) *</label>
            <select value={form.fromMethod} onChange={(e) => set('fromMethod', e.target.value)}
              className={inputCls} style={inputStyle}>
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>A (destino) *</label>
            <select value={form.toMethod} onChange={(e) => set('toMethod', e.target.value)}
              className={inputCls} style={inputStyle}>
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>Fecha *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        {/* Notas */}
        <div>
          <label className={labelCls} style={{ color: 'var(--ps-text-muted)' }}>Notas (opcional)</label>
          <input
            type="text"
            placeholder="Ej: cambio con Juan, tasa 1:1…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold btn-gold disabled:opacity-50">
            {loading ? 'Registrando…' : 'Registrar Cambio'}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
