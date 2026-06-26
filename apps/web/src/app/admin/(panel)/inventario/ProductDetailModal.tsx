'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminModal } from '@/components/admin/AdminModal';
import { ImageOff, Trash2 } from 'lucide-react';
import type { AccordItem, ProductAdmin } from '@persenso/shared';

interface Props {
  product: ProductAdmin;
  onClose: () => void;
  onEdit: () => void;
}

const GENDER_LABEL: Record<string, string> = { HOMBRE: '♂ Hombre', MUJER: '♀ Mujer', UNISEX: '⚥ Unisex' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2" style={{ borderBottom: '1px solid var(--ps-border)' }}>
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: 'var(--ps-text)' }}>{value}</span>
    </div>
  );
}

export function ProductDetailModal({ product, onClose, onEdit }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Error al eliminar');
      }
      toast.success('Producto eliminado');
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el producto');
      setDeleting(false);
      setConfirming(false);
    }
  };

  const stock = product.stock ?? 0;
  const minStock = product.minStock ?? 2;
  const isLow = stock <= minStock;
  const stockColor = stock === 0 ? 'var(--ps-red)' : isLow ? 'var(--ps-gold)' : 'var(--ps-green)';

  return (
    <AdminModal title="Detalle del producto" onClose={onClose} maxWidth="max-w-md">
      {/* Imagen */}
      <div
        className="w-full h-48 rounded-xl overflow-hidden mb-5 flex items-center justify-center"
        style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <ImageOff className="w-10 h-10" style={{ color: 'var(--ps-text-muted)' }} />
        )}
      </div>

      {/* Nombre + meta */}
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold leading-tight" style={{ color: 'var(--ps-text)' }}>
          {product.name}
        </h3>
        {(product.brand || product.concentration) && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--ps-text-muted)' }}>
            {[product.brand, product.concentration].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Info grid */}
      <div className="mb-4">
        {product.sizeMl && <Row label="Tamaño" value={`${product.sizeMl} ml`} />}
        <Row label="Género" value={GENDER_LABEL[product.gender] ?? product.gender} />
        <Row
          label="Stock"
          value={<span style={{ color: stockColor, fontWeight: 600 }}>{stock} u.</span>}
        />
        <Row label="Stock mínimo" value={`${minStock} u.`} />
        <Row
          label="Costo"
          value={<span style={{ color: 'var(--ps-text-muted)' }}>${Number(product.costPrice).toFixed(2)}</span>}
        />
        <Row
          label="Precio venta"
          value={<span style={{ color: 'var(--ps-gold)', fontWeight: 700 }}>${Number(product.salePrice).toFixed(2)}</span>}
        />
        <Row
          label="Visible en tienda"
          value={
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: product.isPublished ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.15)',
                color: product.isPublished ? 'var(--ps-green)' : 'var(--ps-red)',
              }}
            >
              {product.isPublished ? 'Publicado' : 'Oculto'}
            </span>
          }
        />
      </div>

      {product.description && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>
            Descripción
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ps-text)' }}>{product.description}</p>
        </div>
      )}

      {product.notes && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ps-text-muted)' }}>
            Notas internas
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ps-text-muted)' }}>{product.notes}</p>
        </div>
      )}

      {Array.isArray(product.accords) && (product.accords as AccordItem[]).length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--ps-text-muted)' }}>
            Acordes olfativos
          </p>
          <div className="space-y-1.5">
            {([...(product.accords as AccordItem[])].sort((a, b) => b.intensity - a.intensity)).map((a) => (
              <div key={a.name} className="flex items-center gap-2">
                <div className="flex-1 relative h-7 rounded-lg overflow-hidden" style={{ background: 'var(--ps-surface)' }}>
                  <div
                    className="h-full rounded-lg flex items-center px-3"
                    style={{ width: `${a.intensity}%`, background: a.color, minWidth: 60 }}
                  >
                    <span className="text-xs font-medium text-white truncate">{a.name}</span>
                  </div>
                </div>
                <span className="text-xs tabular-nums w-8 text-right flex-shrink-0" style={{ color: 'var(--ps-text-muted)' }}>
                  {a.intensity}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {confirming ? (
          <>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--ps-surface)', color: 'var(--ps-text-muted)', border: '1px solid var(--ps-border)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-50"
              style={{ background: 'rgba(224,92,92,0.15)', color: 'var(--ps-red)', border: '1px solid var(--ps-red)' }}
            >
              {deleting ? 'Eliminando…' : 'Confirmar'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirming(true)}
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(224,92,92,0.1)', color: 'var(--ps-red)', border: '1px solid rgba(224,92,92,0.3)' }}
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="btn-gold flex-1 py-2.5 text-sm font-bold uppercase tracking-widest"
            >
              Editar producto
            </button>
          </>
        )}
      </div>
    </AdminModal>
  );
}
