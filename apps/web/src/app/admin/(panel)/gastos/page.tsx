import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { GastosContent } from './GastosContent';

const EMPTY_LEDGER = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };

export default async function GastosPage() {
  try {
    const [ledger, contributions] = await Promise.all([
      api.ledger.get(),
      api.ledger.getContributions(),
    ]);
    const gastos = ledger.movements.filter((m) => m.type === 'retiro');
    const totalGastos = gastos.reduce((acc, m) => acc + Number(m.amount), 0);
    const socios = contributions.map((c) => c.investor);
    return <GastosContent gastos={gastos} totalGastos={totalGastos} socios={socios} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    const gastos = EMPTY_LEDGER.movements;
    return <GastosContent gastos={gastos} totalGastos={0} socios={[]} />;
  }
}
