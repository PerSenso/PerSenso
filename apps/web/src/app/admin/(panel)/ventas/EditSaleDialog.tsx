'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { Sale } from '@persenso/shared';

interface EditSaleDialogProps {
  sale: Sale;
  onClose: () => void;
}

export function EditSaleDialog({ sale, onClose }: EditSaleDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    total: String(Number(sale.total).toFixed(2)),
    date: sale.date.split('T')[0],
    notes: sale.notes ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: Number(form.total),
          date: new Date(form.date).toISOString(),
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Venta actualizada');
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Venta" onClose={onClose}>
      {/* Info de contexto (solo lectura) */}
      <div
        className="rounded-lg px-4 py-3 mb-5 space-y-1"
        style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--ps-text-muted)' }}>
          Datos de la venta
        </p>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--ps-text-muted)' }}>Cliente</span>
          <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{sale.client?.name ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--ps-text-muted)' }}>Producto</span>
          <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{sale.product?.name ?? '—'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Total ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.total}
            onChange={(e) => setForm({ ...form, total: e.target.value })}
            className={fieldCls}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Fecha</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={fieldCls}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Notas (opcional)</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${fieldCls} resize-none`}
            style={fieldStyle}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
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
