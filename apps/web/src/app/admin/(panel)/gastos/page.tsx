import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { GastosContent } from './GastosContent';

const EMPTY_LEDGER = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };

export default async function GastosPage() {
  try {
    const ledger = await api.ledger.get();
    const gastos = ledger.movements.filter((m) => m.type === 'retiro');
    const totalGastos = gastos.reduce((acc, m) => acc + Number(m.amount), 0);
    return <GastosContent gastos={gastos} totalGastos={totalGastos} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    const gastos = EMPTY_LEDGER.movements;
    return <GastosContent gastos={gastos} totalGastos={0} />;
  }
}
