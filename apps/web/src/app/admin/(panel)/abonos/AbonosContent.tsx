'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import type { SaleWithDebt, Payment } from '@persenso/shared';
import { CreditCard, List, Pencil, Check, X, Trash2 } from 'lucide-react';
import { AbonarDialog } from './AbonarDialog';
import { IdBadge } from '@/components/admin/IdBadge';
import { NotaCell } from '@/components/admin/NotaCell';
import { toast } from 'sonner';

interface AbonosContentProps {
  salesWithDebt: SaleWithDebt[];
}

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

function PendingBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ps-border)', minWidth: 60 }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--ps-green)' : 'var(--ps-gold)' }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

const METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'binance', label: 'Binance' },
];

function fmtMethod(m: string) {
  return METHODS.find((x) => x.value === m)?.label ?? m;
}

function HistorialModal({ sale, onClose }: { sale: SaleWithDebt; onClose: () => void }) {
  const router = useRouter();
  const payments: Payment[] = sale.payments;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', paymentMethod: '', date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startEdit = (p: Payment) => {
    setEditingId(p.id);
    setEditForm({
      amount: String(Number(p.amount)),
      paymentMethod: p.paymentMethod,
      date: new Date(p.date).toISOString().split('T')[0],
      notes: p.notes ?? '',
    });
  };

  const cancelEdit = () => setEditingId(null);

  const deletePayment = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Abono eliminado');
      setConfirmDeleteId(null);
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al eliminar el abono');
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editForm.amount),
          paymentMethod: editForm.paymentMethod,
          date: new Date(editForm.date).toISOString(),
          notes: editForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Abono actualizado');
      setEditingId(null);
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar el abono');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-2 py-1.5 rounded-md text-xs outline-none';
  const inputStyle = { background: 'var(--ps-input-bg)', border: '1px solid var(--ps-gold)', color: 'var(--ps-input-text)' };

  return (
    <AdminModal title={`Historial — ${sale.client.name}`} onClose={onClose}>
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--ps-text)' }}>
          {sale.product.name}
        </p>
        <div className="flex gap-4 text-xs tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--ps-text)' }}>{formatCurrency(sale.total)}</strong></span>
          <span>Pagado: <strong style={{ color: 'var(--ps-green)' }}>{formatCurrency(sale.paid)}</strong></span>
          <span>Pendiente: <strong style={{ color: 'var(--ps-red)' }}>{formatCurrency(sale.pending)}</strong></span>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
          Sin abonos registrados.
        </p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-lg px-3 py-2.5" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              {editingId === p.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>Monto</p>
                      <input type="number" step="0.01" value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>Método</p>
                      <select value={editForm.paymentMethod}
                        onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                        className={inputCls} style={inputStyle}>
                        {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>Fecha</p>
                      <input type="date" value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>Notas</p>
                      <input type="text" value={editForm.notes} placeholder="Opcional"
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button onClick={() => saveEdit(p.id)} disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold btn-gold disabled:opacity-50">
                      <Check className="w-3 h-3" /> {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === p.id ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    ¿Eliminar abono de <strong style={{ color: 'var(--ps-red)' }}>{formatCurrency(Number(p.amount))}</strong>?
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button onClick={() => deletePayment(p.id)} disabled={deleting}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                      style={{ background: 'rgba(224,92,92,0.18)', color: 'var(--ps-red)', border: '1px solid var(--ps-red)' }}>
                      <Trash2 className="w-3 h-3" /> {deleting ? 'Eliminando…' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm flex-1 min-w-0">
                    <span style={{ color: 'var(--ps-text-muted)' }} className="text-xs">
                      {new Date(p.date).toLocaleDateString('es-VE')}
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--ps-green)' }}>
                      {formatCurrency(Number(p.amount))}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                      {fmtMethod(p.paymentMethod)}
                    </span>
                    {p.notes && (
                      <span className="text-xs truncate" style={{ color: 'var(--ps-text-muted)' }}>{p.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
                      title="Editar abono">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(p.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: 'var(--ps-red)', background: 'rgba(224,92,92,0.1)', border: '1px solid var(--ps-red)' }}
                      title="Eliminar abono">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
        >
          Cerrar
        </button>
      </div>
    </AdminModal>
  );
}

export function AbonosContent({ salesWithDebt }: AbonosContentProps) {
  const router = useRouter();
  const [abonarSale, setAbonarSale] = useState<SaleWithDebt | null>(null);
  const [historialSale, setHistorialSale] = useState<SaleWithDebt | null>(null);

  const totalDebt = salesWithDebt.reduce((s, x) => s + x.pending, 0);

  return (
    <>
      <AdminPageHeader
        title="Abonos"
        subtitle={`${salesWithDebt.length} venta(s) con deuda · ${formatCurrency(totalDebt)} pendiente`}
      />

      {abonarSale && (
        <AbonarDialog
          sale={abonarSale}
          onClose={() => setAbonarSale(null)}
          onSuccess={() => router.refresh()}
        />
      )}
      {historialSale && (
        <HistorialModal sale={historialSale} onClose={() => setHistorialSale(null)} />
      )}

      <AdminDataTable
        data={salesWithDebt}
        keyExtractor={(s) => s.id}
        emptyMessage="No hay ventas con deuda pendiente"
        searchable
        searchPlaceholder="Buscar por cliente o producto…"
        searchKeys={['client.name', 'product.name']}
        columns={[
          { key: '_id', header: 'ID', render: (s) => <IdBadge id={s.id} /> },
          {
            key: 'date', header: 'Fecha', sortable: true,
            render: (s) => new Date(s.date).toLocaleDateString('es-VE'),
          },
          {
            key: 'client', header: 'Cliente',
            render: (s) => (
              <span className="font-medium" style={{ color: 'var(--ps-text)' }}>{s.client.name}</span>
            ),
          },
          {
            key: 'product', header: 'Producto',
            render: (s) => s.product.name,
          },
          {
            key: 'total', header: 'Total', sortable: true, align: 'right',
            render: (s) => (
              <span className="tabular-nums" style={{ color: 'var(--ps-text-soft)' }}>
                {formatCurrency(s.total)}
              </span>
            ),
          },
          {
            key: 'paid', header: 'Pagado', align: 'right',
            render: (s) => (
              <span className="tabular-nums font-medium" style={{ color: 'var(--ps-green)' }}>
                {formatCurrency(s.paid)}
              </span>
            ),
          },
          {
            key: 'pending', header: 'Pendiente', sortable: true, align: 'right',
            render: (s) => (
              <span className="tabular-nums font-semibold" style={{ color: 'var(--ps-red)' }}>
                {formatCurrency(s.pending)}
              </span>
            ),
          },
          {
            key: '_bar', header: 'Avance',
            render: (s) => <PendingBar paid={s.paid} total={s.total} />,
          },
          {
            key: '_actions', header: '',
            render: (s) => (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <button
                  onClick={(e) => { e.stopPropagation(); setHistorialSale(s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                  style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
                  title="Ver historial de abonos"
                >
                  <List className="w-3.5 h-3.5 flex-shrink-0" />
                  Historial
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setAbonarSale(s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest btn-gold whitespace-nowrap"
                  title="Registrar abono"
                >
                  <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                  Abonar
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
