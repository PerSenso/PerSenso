'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { AdminModal, fieldCls, fieldStyle, labelCls, labelStyle } from '@/components/admin/AdminModal';

interface Props {
  onClose: () => void;
}

type Step = 'idle' | 'creating' | 'uploading';
const stepLabel: Record<Step, string> = {
  idle: 'Crear Producto',
  creating: 'Creando producto…',
  uploading: 'Subiendo imagen…',
};

export function NewProductoDialog({ onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    concentration: '',
    gender: 'UNISEX',
    sizeMl: '',
    costPrice: '',
    salePrice: '',
    minStock: '2',
    notes: '',
    isPublished: true,
  });

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStep('creating');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        costPrice: Number(form.costPrice),
        salePrice: Number(form.salePrice),
        isPublished: form.isPublished,
        minStock: form.minStock ? Number(form.minStock) : 2,
      };
      if (form.brand) body.brand = form.brand;
      if (form.concentration) body.concentration = form.concentration;
      if (form.gender) body.gender = form.gender;
      if (form.sizeMl) body.sizeMl = Number(form.sizeMl);
      if (form.notes) body.notes = form.notes;

      const createRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        const d = await createRes.json();
        throw new Error(d.message ?? 'Error al crear producto');
      }
      const product = await createRes.json() as { id: string };

      if (imageFile) {
        setStep('uploading');
        const fd = new FormData();
        fd.append('image', imageFile);
        const imgRes = await fetch(`/api/admin/products/${product.id}/image`, {
          method: 'POST',
          body: fd,
        });
        if (!imgRes.ok) {
          setError('Producto creado, pero la imagen no pudo subirse.');
          router.refresh();
          return;
        }
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
    } finally {
      setLoading(false);
      setStep('idle');
    }
  }

  return (
    <AdminModal title="Nuevo Producto" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen */}
        <div>
          <label className={labelCls} style={labelStyle}>Imagen del producto</label>
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Vista previa" className="w-full h-36 object-cover rounded-lg" />
              <button type="button" onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-lg cursor-pointer"
              style={{ border: '2px dashed var(--ps-border)', color: 'var(--ps-text-muted)' }}
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">Haz clic para seleccionar imagen</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className={labelCls} style={labelStyle}>Nombre *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            className={fieldCls} style={fieldStyle} />
        </div>

        {/* Marca + Concentración */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Marca</label>
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Concentración</label>
            <select value={form.concentration} onChange={(e) => set('concentration', e.target.value)}
              className={fieldCls} style={fieldStyle}>
              <option value="">— Seleccionar —</option>
              <option value="EDP">EDP</option>
              <option value="EDT">EDT</option>
              <option value="EDC">EDC</option>
              <option value="Parfum">Parfum</option>
              <option value="Cologne">Cologne</option>
              <option value="Mist">Mist</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Género + Tamaño */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Género</label>
            <select value={form.gender} onChange={(e) => set('gender', e.target.value)}
              className={fieldCls} style={fieldStyle}>
              <option value="HOMBRE">Hombre</option>
              <option value="MUJER">Mujer</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Tamaño (ml)</label>
            <input type="number" min="0" value={form.sizeMl}
              onChange={(e) => set('sizeMl', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        {/* Costo + Precio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Costo ($) *</label>
            <input required type="number" min="0" step="0.01" value={form.costPrice}
              onChange={(e) => set('costPrice', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Precio Venta ($) *</label>
            <input required type="number" min="0" step="0.01" value={form.salePrice}
              onChange={(e) => set('salePrice', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
        </div>

        {/* Stock mínimo + Visible */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={labelStyle}>Stock mínimo</label>
            <input type="number" min="0" value={form.minStock}
              onChange={(e) => set('minStock', e.target.value)}
              className={fieldCls} style={fieldStyle} />
          </div>
          <div className="flex flex-col justify-end">
            <label className={labelCls} style={labelStyle}>Visible en tienda</label>
            <button type="button" onClick={() => set('isPublished', !form.isPublished)}
              className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: form.isPublished ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.15)',
                color: form.isPublished ? 'var(--ps-green)' : 'var(--ps-red)',
                border: '1px solid var(--ps-border)',
              }}>
              {form.isPublished ? 'Sí' : 'No'}
            </button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className={labelCls} style={labelStyle}>Notas</label>
          <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
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
            {stepLabel[step]}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
