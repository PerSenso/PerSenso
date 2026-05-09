'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';

interface Props {
  onClose: () => void;
}

export function NewProveedorDialog({ onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = { name: form.name };
      if (form.phone) body.phone = form.phone;
      if (form.notes) body.notes = form.notes;

      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Error al crear proveedor'); }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proveedor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminModal title="Nuevo Proveedor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Nombre *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className={fieldCls} style={fieldStyle} />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Teléfono</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
            className={fieldCls} style={fieldStyle} />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Notas</label>
          <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)}
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
            {loading ? 'Guardando…' : 'Crear Proveedor'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
