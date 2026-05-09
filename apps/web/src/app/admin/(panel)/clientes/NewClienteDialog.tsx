'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function NewClienteDialog({ onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', ci: '', phone: '', address: '', notes: '' });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = { name: form.name };
      if (form.ci) body.ci = form.ci;
      if (form.phone) body.phone = form.phone;
      if (form.address) body.address = form.address;
      if (form.notes) body.notes = form.notes;

      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Error al crear cliente'); }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--ps-text)' }}>Nuevo Cliente</h2>
          <button onClick={onClose} style={{ color: 'var(--ps-text-muted)' }}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Nombre *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Cédula</label>
              <input value={form.ci} onChange={(e) => set('ci', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Teléfono</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ps-text-muted)' }}>Dirección</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--ps-bg)', border: '1px solid var(--ps-border)', color: 'var(--ps-text)' }} />
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
              {loading ? 'Guardando…' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
