'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Upload, ExternalLink, Trash2 } from 'lucide-react';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { Sale } from '@persenso/shared';

interface EditSaleDialogProps {
  sale: Sale;
  onClose: () => void;
}

function fmtMethod(m: string) {
  const map: Record<string, string> = {
    efectivo: 'Efectivo', pago_movil: 'Pago Móvil',
    transferencia: 'Transferencia', zelle: 'Zelle', binance: 'Binance',
  };
  return map[m] ?? m;
}

export function EditSaleDialog({ sale, onClose }: EditSaleDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [localReceipts, setLocalReceipts] = useState<Record<string, string>>(
    () => Object.fromEntries((sale.payments ?? []).filter((p) => p.receiptUrl).map((p) => [p.id, p.receiptUrl!]))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPaymentId = useRef<string | null>(null);
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
          notes: form.notes || null,
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const paymentId = pendingPaymentId.current;
    if (!file || !paymentId) return;
    e.target.value = '';

    setUploadingId(paymentId);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      const res = await fetch(`/api/admin/payments/${paymentId}/receipt`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.receiptUrl) setLocalReceipts((prev) => ({ ...prev, [paymentId]: data.receiptUrl }));
      toast.success('Comprobante subido');
      router.refresh();
    } catch {
      toast.error('Error al subir el comprobante');
    } finally {
      setUploadingId(null);
      pendingPaymentId.current = null;
    }
  };

  const triggerUpload = (paymentId: string) => {
    pendingPaymentId.current = paymentId;
    fileInputRef.current?.click();
  };

  const handleDeleteReceipt = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/receipt`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLocalReceipts((prev) => { const next = { ...prev }; delete next[paymentId]; return next; });
      toast.success('Comprobante eliminado');
      router.refresh();
    } catch {
      toast.error('Error al eliminar el comprobante');
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

      {(sale.payments ?? []).length > 0 && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--ps-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ps-text-muted)' }}>
            Comprobantes de pago
          </p>
          <div className="space-y-2">
            {(sale.payments ?? []).map((p) => {
              const receiptUrl = localReceipts[p.id];
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {receiptUrl ? (
                      <a href={receiptUrl} target="_blank" rel="noreferrer" title="Ver comprobante">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={receiptUrl} alt="comprobante" className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                          style={{ border: '1px solid var(--ps-border)' }} />
                      </a>
                    ) : (
                      <div className="w-9 h-9 rounded-md flex-shrink-0 flex items-center justify-center"
                        style={{ border: '1px dashed var(--ps-border)', color: 'var(--ps-text-muted)' }}>
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--ps-text)' }}>
                        ${Number(p.amount).toFixed(2)}
                      </span>
                      <span className="mx-1.5 text-xs" style={{ color: 'var(--ps-text-muted)' }}>·</span>
                      <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>{fmtMethod(p.paymentMethod)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {receiptUrl && (
                      <a href={receiptUrl} target="_blank" rel="noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--ps-gold)', background: 'rgba(201,168,76,0.1)' }}
                        title="Ver comprobante">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => triggerUpload(p.id)}
                      disabled={uploadingId === p.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-50"
                      style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
                      title={receiptUrl ? 'Reemplazar comprobante' : 'Subir comprobante'}>
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    {receiptUrl && (
                      <button
                        onClick={() => handleDeleteReceipt(p.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--ps-red)', background: 'rgba(224,92,92,0.1)' }}
                        title="Eliminar comprobante">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
        </div>
      )}
    </AdminModal>
  );
}
