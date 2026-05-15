'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { ClientWithDebt } from '@persenso/shared';

interface EditClienteDialogProps {
  client: ClientWithDebt;
  onClose: () => void;
}

export function EditClienteDialog({ client, onClose }: EditClienteDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    ci: client.ci ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
    source: (client as { source?: string }).source ?? '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ci: form.ci || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          notes: form.notes || undefined,
          source: form.source || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Cliente actualizado');
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Nombre *</label>
          <input required value={form.name} onChange={set('name')} className={fieldCls} style={fieldStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Cédula</label>
            <input value={form.ci} onChange={set('ci')} className={fieldCls} style={fieldStyle} placeholder="V-12345678" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Teléfono</label>
            <div className="flex">
              <span className="flex items-center px-3 rounded-l-lg text-sm font-medium select-none"
                style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', borderRight: 'none', color: 'var(--ps-text-muted)' }}>
                +58
              </span>
              <input value={form.phone} onChange={set('phone')} placeholder="412-0000000"
                className={fieldCls} style={{ ...fieldStyle, borderRadius: '0 8px 8px 0' }} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Dirección</label>
          <input value={form.address} onChange={set('address')} className={fieldCls} style={fieldStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>¿De dónde viene?</label>
            <select value={form.source} onChange={set('source')} className={fieldCls} style={fieldStyle}>
              <option value="">— Seleccionar —</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Referido">Referido</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Notas</label>
            <textarea rows={1} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} style={fieldStyle} />
          </div>
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
