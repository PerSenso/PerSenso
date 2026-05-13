'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Paperclip, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Client, ProductAdmin } from '@persenso/shared';

interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function Combobox({ options, value, onChange, placeholder }: ComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered =
    query.length === 0
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(query.toLowerCase()) ||
            o.sublabel?.toLowerCase().includes(query.toLowerCase()),
        );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery('');
  };

  const displayValue = open ? query : (selected?.label ?? '');

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (e.target.value === '') onChange('');
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2.5 pr-8 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--ps-input-bg)',
            border: `1px solid ${open ? 'var(--ps-gold)' : 'var(--ps-input-border)'}`,
            color: 'var(--ps-input-text)',
          }}
        />
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--ps-text-muted)' }}
        />
      </div>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
          style={{
            background: 'var(--ps-surface)',
            border: '1px solid var(--ps-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: 'var(--ps-text-muted)' }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className="px-3 py-2.5 text-sm transition-colors"
                  style={{
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.4 : 1,
                    color: opt.value === value ? 'var(--ps-gold)' : 'var(--ps-text)',
                    background: opt.value === value ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!opt.disabled) (e.currentTarget as HTMLDivElement).style.background = 'var(--ps-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      opt.value === value ? 'rgba(201,168,76,0.08)' : 'transparent';
                  }}
                >
                  <div className="font-medium">{opt.label}</div>
                  {opt.sublabel && (
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--ps-text-muted)' }}>
                      {opt.sublabel}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NewSaleDialogProps {
  clients: Client[];
  products: ProductAdmin[];
  onClose: () => void;
}

export function NewSaleDialog({ clients, products, onClose }: NewSaleDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    clientId: '',
    productId: '',
    total: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    initialPaymentAmount: '',
    initialPaymentMethod: '',
  });

  const selectedProduct = products.find((p) => p.id === form.productId);

  const clientOptions: ComboboxOption[] = clients.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: [c.ci ? `CI: ${c.ci}` : null, c.phone ? `Tel: ${c.phone}` : null].filter(Boolean).join(' · ') || undefined,
  }));

  const productOptions: ComboboxOption[] = [...products]
    .sort((a, b) => Number((b.stock ?? 0) > 0) - Number((a.stock ?? 0) > 0))
    .map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `${p.brand ? `${p.brand} · ` : ''}$${Number(p.salePrice).toFixed(2)} · ${(p.stock ?? 0) > 0 ? `Stock: ${p.stock}` : 'Sin stock'}`,
      disabled: (p.stock ?? 0) <= 0,
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error('Selecciona un cliente'); return; }
    if (!form.productId) { toast.error('Selecciona un producto'); return; }
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        clientId: form.clientId,
        productId: form.productId,
        total: Number(form.total),
        date: new Date(form.date).toISOString(),
        notes: form.notes || undefined,
      };

      if (form.initialPaymentAmount && form.initialPaymentMethod) {
        body.initialPayment = {
          amount: Number(form.initialPaymentAmount),
          method: form.initialPaymentMethod,
        };
      }

      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Error al crear la venta');
      }

      const created = await res.json() as { payments?: { id: string; isInitial: boolean }[] };
      if (receiptFile && created.payments?.length) {
        const initialPayment = created.payments.find((p) => p.isInitial) ?? created.payments[0];
        const fd = new FormData();
        fd.append('receipt', receiptFile);
        await fetch(`/api/admin/payments/${initialPayment.id}/receipt`, { method: 'POST', body: fd });
      }

      toast.success('Venta creada exitosamente');
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-persenso p-6 w-full max-w-lg relative z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--ps-gold)' }}>
            Nueva Venta
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--ps-text-muted)', background: 'var(--ps-surface)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--ps-text-muted)' }}>
              Cliente
            </label>
            <Combobox
              options={clientOptions}
              value={form.clientId}
              onChange={(v) => setForm({ ...form, clientId: v })}
              placeholder="Buscar cliente..."
            />
          </div>

          {/* Product */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--ps-text-muted)' }}>
              Producto
            </label>
            <Combobox
              options={productOptions}
              value={form.productId}
              onChange={(v) => {
                const product = products.find((p) => p.id === v);
                setForm({
                  ...form,
                  productId: v,
                  total: product ? String(product.salePrice) : form.total,
                });
              }}
              placeholder="Buscar producto..."
            />
            {selectedProduct && (
              <p className="text-xs mt-1" style={{ color: 'var(--ps-text-muted)' }}>
                Precio sugerido: ${Number(selectedProduct.salePrice).toFixed(2)}
              </p>
            )}
          </div>

          {/* Total */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--ps-text-muted)' }}>
              Total ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-input-text)' }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--ps-text-muted)' }}>
              Fecha
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-input-text)' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--ps-text-muted)' }}>
              Notas (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
              style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-input-text)' }}
            />
          </div>

          {/* Initial payment */}
          <div className="pt-2" style={{ borderTop: '1px solid var(--ps-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--ps-text-muted)' }}>
              Pago Inicial (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  value={form.initialPaymentAmount}
                  onChange={(e) => setForm({ ...form, initialPaymentAmount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-input-text)' }}
                />
              </div>
              <div>
                <select
                  value={form.initialPaymentMethod}
                  onChange={(e) => setForm({ ...form, initialPaymentMethod: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--ps-input-bg)', border: '1px solid var(--ps-input-border)', color: 'var(--ps-input-text)' }}
                >
                  <option value="">Método</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="zelle">Zelle</option>
                  <option value="binance">Binance</option>
                </select>
              </div>
            </div>
            {form.initialPaymentAmount && form.initialPaymentMethod && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => receiptInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    border: '1px dashed var(--ps-border)',
                    color: receiptFile ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
                    background: receiptFile ? 'rgba(201,168,76,0.06)' : 'transparent',
                  }}
                >
                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{receiptFile ? receiptFile.name : 'Adjuntar comprobante (opcional)'}</span>
                </button>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 text-sm font-bold uppercase tracking-widest mt-2 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Venta'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
