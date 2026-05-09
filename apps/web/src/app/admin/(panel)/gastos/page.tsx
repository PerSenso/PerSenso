import { api } from '@/lib/api-client';
import { GastosContent } from './GastosContent';

export default async function GastosPage() {
  let ledger: import('@persenso/shared').LedgerSummary;

  try {
    ledger = await api.ledger.get();
  } catch {
    ledger = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };
  }

  // Filter only "retiro" movements for the gastos page
  const gastos = ledger.movements.filter((m) => m.type === 'retiro');
  const totalGastos = gastos.reduce((acc, m) => acc + Number(m.amount), 0);

  return <GastosContent gastos={gastos} totalGastos={totalGastos} />;
}
