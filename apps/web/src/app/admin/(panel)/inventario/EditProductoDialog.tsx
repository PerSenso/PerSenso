'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { ProductAdmin } from '@persenso/shared';

interface EditProductoDialogProps {
  product: ProductAdmin;
  onClose: () => void;
}

const GENDER_OPTIONS = ['HOMBRE', 'MUJER', 'UNISEX'] as const;
const CONCENTRATION_OPTIONS = ['EDP', 'EDT', 'EDC', 'Parfum', 'Cologne', 'Mist', 'Other'];

export function EditProductoDialog({ product, onClose }: EditProductoDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand ?? '',
    size: product.size ?? '',
    sizeMl: product.sizeMl ? String(product.sizeMl) : '',
    concentration: product.concentration ?? '',
    gender: product.gender,
    description: product.description ?? '',
    costPrice: String(Number(product.costPrice).toFixed(2)),
    salePrice: String(Number(product.salePrice).toFixed(2)),
    minStock: String(product.minStock ?? 2),
    notes: product.notes ?? '',
    isPublished: product.isPublished,
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand || undefined,
          size: form.size || undefined,
          sizeMl: form.sizeMl ? Number(form.sizeMl) : undefined,
          concentration: form.concentration || undefined,
          gender: form.gender,
          description: form.description || undefined,
          costPrice: Number(form.costPrice),
          salePrice: Number(form.salePrice),
          minStock: Number(form.minStock),
          notes: form.notes || undefined,
          isPublished: form.isPublished,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Producto actualizado');
      router.refresh();
      onClose();
    } catch {
      toast.error('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal title="Editar Producto" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre + Marca */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Nombre *</label>
            <input required value={form.name} onChange={set('name')} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Marca</label>
            <input value={form.brand} onChange={set('brand')} className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        {/* Tamaño + ml */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Tamaño</label>
            <input value={form.size} onChange={set('size')} placeholder="ej: 100ml" className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>ml (numérico)</label>
            <input type="number" min="0" value={form.sizeMl} onChange={set('sizeMl')} className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        {/* Concentración + Género */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Concentración</label>
            <select value={form.concentration} onChange={set('concentration')} className={fieldCls} style={fieldStyle}>
              <option value="">— Ninguna —</option>
              {CONCENTRATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Género *</label>
            <select required value={form.gender} onChange={set('gender')} className={fieldCls} style={fieldStyle}>
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Costo + Precio venta */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Costo ($) *</label>
            <input type="number" step="0.01" min="0" required value={form.costPrice} onChange={set('costPrice')} className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Precio venta ($) *</label>
            <input type="number" step="0.01" min="0" required value={form.salePrice} onChange={set('salePrice')} className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        {/* Stock mínimo + Visible */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Stock mínimo</label>
            <input type="number" min="0" value={form.minStock} onChange={set('minStock')} className={fieldCls} style={fieldStyle} />
          </div>
          <div className="flex flex-col justify-end pb-0.5">
            <label className={labelCls} style={labelStyle}>Visible en tienda</label>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: form.isPublished ? 'rgba(76,175,125,0.12)' : 'var(--ps-input-bg)',
                border: `1px solid ${form.isPublished ? 'var(--ps-green)' : 'var(--ps-input-border)'}`,
                color: form.isPublished ? 'var(--ps-green)' : 'var(--ps-text-muted)',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: form.isPublished ? 'var(--ps-green)' : 'var(--ps-text-muted)' }} />
              {form.isPublished ? 'Publicado' : 'Oculto'}
            </button>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls} style={labelStyle}>Descripción</label>
          <textarea rows={2} value={form.description} onChange={set('description')} className={`${fieldCls} resize-none`} style={fieldStyle} />
        </div>

        {/* Notas */}
        <div>
          <label className={labelCls} style={labelStyle}>Notas internas</label>
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={`${fieldCls} resize-none`} style={fieldStyle} />
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
