import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { SaldoContent } from './SaldoContent';

const EMPTY_LEDGER = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };

export default async function SaldoPage() {
  try {
    const ledger = await api.ledger.get();
    return <SaldoContent ledger={ledger} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <SaldoContent ledger={EMPTY_LEDGER} />;
  }
}
