'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { Supplier } from '@persenso/shared';

interface EditProveedorDialogProps {
  supplier: Supplier;
  onClose: () => void;
}

export function EditProveedorDialog({ supplier, onClose }: EditProveedorDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: supplier.name,
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    notes: supplier.notes ?? '',
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Proveedor actualizado');
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Proveedor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Nombre *</label>
          <input required value={form.name} onChange={set('name')} className={fieldCls} style={fieldStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Teléfono</label>
            <input value={form.phone} onChange={set('phone')} className={fieldCls} style={fieldStyle} placeholder="+58 412…" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} className={fieldCls} style={fieldStyle} placeholder="proveedor@email.com" />
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
