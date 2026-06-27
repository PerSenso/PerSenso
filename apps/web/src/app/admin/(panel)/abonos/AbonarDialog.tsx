'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { SaleWithDebt } from '@persenso/shared';

const PAYMENT_METHODS = ['Efectivo', 'Pago Móvil', 'Zelle', 'USDT', 'Otro'];

interface AbonarDialogProps {
  sale: SaleWithDebt;
  onClose: () => void;
  onSuccess: () => void;
}

export function AbonarDialog({ sale, onClose, onSuccess }: AbonarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'Efectivo',
    notes: '',
  });

  const maxAmount = sale.pending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (amount > maxAmount + 0.001) {
      toast.error(`El monto no puede superar la deuda pendiente ($${maxAmount.toFixed(2)})`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          clientId: sale.client.id,
          amount,
          paymentMethod: form.paymentMethod,
          date: new Date().toISOString(),
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Error al registrar abono');
      }
      toast.success('Abono registrado');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Registrar Abono" onClose={onClose}>
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>
          Venta
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--ps-text)' }}>
          {sale.client.name} — {sale.product.name}
        </p>
        <div className="flex gap-4 mt-2 text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--ps-text)' }}>${sale.total.toFixed(2)}</strong></span>
          <span>Pagado: <strong style={{ color: 'var(--ps-green)' }}>${sale.paid.toFixed(2)}</strong></span>
          <span>Pendiente: <strong style={{ color: 'var(--ps-red)' }}>${sale.pending.toFixed(2)}</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Monto *</label>
          <input
            type="number"
            step="0.01"
            placeholder={`Máx. $${maxAmount.toFixed(2)}`}
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            className={fieldCls}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Método de pago *</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            className={fieldCls}
            style={fieldStyle}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Notas</label>
          <input
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className={fieldCls}
            style={fieldStyle}
            placeholder="Opcional"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-gold py-2.5 text-sm font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
