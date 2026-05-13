'use client';

import { useEffect, useState } from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { Phone, MapPin, Hash, Share2, Copy, Check } from 'lucide-react';
import type { ClientWithDebt } from '@persenso/shared';

interface Sale {
  id: string;
  date: string;
  total: number;
  status: string;
  product: { id: string; name: string; brand?: string };
  payments: { id: string; amount: number; paymentMethod: string; date: string }[];
}

interface ClientDetail extends ClientWithDebt {
  source?: string;
  sales: Sale[];
  totalSpent: number;
  totalPaid: number;
}

interface Props {
  client: ClientWithDebt;
  onClose: () => void;
}


function fmt(n: number) { return `$${n.toFixed(2)}`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-VE'); }

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <span className="text-[10px] font-mono" style={{ color: 'var(--ps-gold)' }}>
        #{id.slice(0, 8)}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="w-4 h-4 flex items-center justify-center rounded transition-opacity hover:opacity-70"
        title="Copiar ID completo"
      >
        {copied
          ? <Check className="w-3 h-3" style={{ color: 'var(--ps-green)' }} />
          : <Copy className="w-3 h-3" style={{ color: 'var(--ps-gold)' }} />
        }
      </button>
    </div>
  );
}

export function ClienteDetailModal({ client, onClose }: Props) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clients/${client.id}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [client.id]);

  return (
    <AdminModal title={client.name} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--ps-text-muted)' }}>
          Cargando…
        </div>
      ) : !detail ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--ps-red)' }}>
          Error al cargar el detalle
        </div>
      ) : (
        <div className="space-y-5">

          {/* Info de contacto */}
          <div className="grid grid-cols-2 gap-2">
            {detail.ci && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ps-text-muted)' }}>
                <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{detail.ci}</span>
              </div>
            )}
            {detail.phone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ps-text-muted)' }}>
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{detail.phone}</span>
              </div>
            )}
            {detail.address && (
              <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: 'var(--ps-text-muted)' }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{detail.address}</span>
              </div>
            )}
            {detail.source && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ps-text-muted)' }}>
                <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{detail.source}</span>
              </div>
            )}
          </div>

          {/* Resumen financiero */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total compras', value: fmt(detail.totalSpent), color: 'var(--ps-text)' },
              { label: 'Total pagado',  value: fmt(detail.totalPaid),  color: 'var(--ps-green)' },
              { label: 'Deuda',         value: detail.debt > 0 ? fmt(detail.debt) : '—', color: detail.debt > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: 'var(--ps-surface)', border: '1px solid var(--ps-border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--ps-text-muted)' }}>{label}</p>
                <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Historial de ventas */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--ps-text-muted)' }}>
              Historial · {detail.sales.length} {detail.sales.length === 1 ? 'compra' : 'compras'}
            </p>

            {detail.sales.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--ps-text-muted)' }}>
                Sin compras registradas
              </p>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ps-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--ps-surface)', borderBottom: '1px solid var(--ps-border)' }}>
                      {['Fecha', 'Perfume', 'Total', 'Pagado', 'Pendiente'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: 'var(--ps-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.sales.map((sale, idx) => {
                      const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
                      const pending = Math.max(0, Number(sale.total) - paid);
                      const isAnulada = sale.status === 'ANULADA';
                      return (
                        <tr key={sale.id}
                          style={{
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid var(--ps-border)',
                            opacity: isAnulada ? 0.5 : 1,
                          }}>
                          <td className="px-3 py-2.5" style={{ color: 'var(--ps-text-muted)' }}>
                            <div className="tabular-nums">{fmtDate(sale.date)}</div>
                            <CopyId id={sale.id} />
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-medium" style={{ color: 'var(--ps-text)' }}>
                              {sale.product.name}
                            </span>
                            {sale.product.brand && (
                              <span className="ml-1 text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                                · {sale.product.brand}
                              </span>
                            )}
                            {isAnulada && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(224,92,92,0.15)', color: 'var(--ps-red)' }}>
                                Anulada
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ps-text)' }}>
                            {fmt(Number(sale.total))}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--ps-green)' }}>
                            {paid > 0 ? fmt(paid) : '—'}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums font-semibold"
                            style={{ color: pending > 0 ? 'var(--ps-red)' : 'var(--ps-text-muted)' }}>
                            {pending > 0 ? fmt(pending) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </AdminModal>
  );
}
