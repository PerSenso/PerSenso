'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';
import type { ProductAdmin, SupplierStockEntry } from '@persenso/shared';

interface EditProductoDialogProps {
  product: ProductAdmin;
  onClose: () => void;
}

const GENDER_OPTIONS = ['HOMBRE', 'MUJER', 'UNISEX'] as const;
const CONCENTRATION_OPTIONS = ['EDP', 'EDT', 'EDC', 'Parfum', 'Cologne', 'Mist', 'Other'];

export function EditProductoDialog({ product, onClose }: EditProductoDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl ?? null);
  const [imageUploading, setImageUploading] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierStockEntry[]>([]);

  useEffect(() => {
    fetch(`/api/admin/products/${product.id}/suppliers`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, [product.id]);
  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand ?? '',
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

        {/* ml */}
        <div>
          <label className={labelCls} style={labelStyle}>Tamaño (ml)</label>
          <input type="number" min="0" value={form.sizeMl} onChange={set('sizeMl')} className={fieldCls} style={fieldStyle} />
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

        {/* Imagen */}
        <div>
          <label className={labelCls} style={labelStyle}>Foto del producto</label>
          <div className="flex items-center gap-3 mt-1">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
              style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
              {imageUrl ? (
                <Image src={imageUrl} alt="Producto" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📷</div>
              )}
              {imageUploading && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
                {imageUploading ? 'Subiendo…' : imageUrl ? 'Cambiar foto' : 'Subir foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append('image', file);
                    const res = await fetch(`/api/admin/products/${product.id}/image`, {
                      method: 'POST',
                      body: fd,
                    });
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    setImageUrl(data.imageUrl ?? data.url ?? null);
                    toast.success('Foto actualizada');
                    router.refresh();
                  } catch {
                    toast.error('Error al subir la imagen');
                  } finally {
                    setImageUploading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Lotes por proveedor */}
        {suppliers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--ps-text-muted)' }}>
              Lotes por proveedor
            </p>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--ps-border)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--ps-surface)' }}>
                    {['Proveedor', 'Cant.', 'Costo u.', 'Fecha'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold"
                        style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((entry, i) => (
                    <tr key={`${entry.orderId}-${i}`}
                      style={{ borderTop: '1px solid var(--ps-border)' }}>
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--ps-text)' }}>
                        {entry.supplierName}
                      </td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--ps-text)' }}>
                        {entry.quantity}u
                      </td>
                      <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--ps-text-muted)' }}>
                        ${Number(entry.baseUnitCost).toFixed(2)}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--ps-text-muted)' }}>
                        {new Date(entry.date).toLocaleDateString('es-VE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {suppliers.length > 1 && (
              <p className="mt-1 text-[10px]" style={{ color: 'var(--ps-text-muted)' }}>
                {suppliers.length} lotes de {new Set(suppliers.map((s) => s.supplierName)).size} proveedor(es)
              </p>
            )}
          </div>
        )}

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
