'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';

interface Props {
  onClose: () => void;
}

export function NewUserDialog({ onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', confirm: '', role: 'ADMIN' as 'ADMIN' | 'OWNER' });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, role: form.role }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'Error al crear usuario');
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminModal title="Nuevo Usuario" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} style={labelStyle}>Usuario *</label>
          <input required minLength={3} value={form.username} onChange={(e) => set('username', e.target.value)}
            placeholder="Ej: carlos" className={fieldCls} style={fieldStyle} />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Rol *</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)} className={fieldCls} style={fieldStyle}>
            <option value="ADMIN">ADMIN</option>
            <option value="OWNER">OWNER (Dueño)</option>
          </select>
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Contraseña *</label>
          <input required minLength={6} type="password" value={form.password}
            onChange={(e) => set('password', e.target.value)} className={fieldCls} style={fieldStyle} />
        </div>

        <div>
          <label className={labelCls} style={labelStyle}>Confirmar contraseña *</label>
          <input required minLength={6} type="password" value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)} className={fieldCls} style={fieldStyle} />
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
            {loading ? 'Creando…' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
