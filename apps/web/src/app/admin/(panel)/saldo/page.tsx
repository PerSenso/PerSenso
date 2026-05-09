import { api } from '@/lib/api-client';
import { SaldoContent } from './SaldoContent';

export default async function SaldoPage() {
  let ledger: import('@persenso/shared').LedgerSummary;

  try {
    ledger = await api.ledger.get();
  } catch {
    ledger = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };
  }

  return <SaldoContent ledger={ledger} />;
}
