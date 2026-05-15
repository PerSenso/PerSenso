import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { SaldoContent } from './SaldoContent';

export default async function SaldoPage() {
  try {
    const [ledger, contributions] = await Promise.all([
      api.ledger.get(),
      api.ledger.getContributions(),
    ]);
    return <SaldoContent ledger={ledger} contributions={contributions} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return (
      <div className="p-8">
        <div className="rounded-xl p-6 text-sm" style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid var(--ps-red)', color: 'var(--ps-red)' }}>
          <strong>Error al cargar Saldo / Caja:</strong> {message}
        </div>
      </div>
    );
  }
}
