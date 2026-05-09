import { api } from '@/lib/api-client';
import { DashboardContent } from './DashboardContent';

export default async function DashboardPage() {
  let sales: import('@persenso/shared').Sale[];
  let clients: import('@persenso/shared').Client[];
  let products: import('@persenso/shared').ProductAdmin[];
  let ledger: import('@persenso/shared').LedgerSummary;

  try {
    [sales, clients, products, ledger] = await Promise.all([
      api.sales.list(),
      api.clients.list(),
      api.products.list(),
      api.ledger.get(),
    ]);
  } catch {
    // If API is not available, show empty state
    sales = [];
    clients = [];
    products = [];
    ledger = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };
  }

  return (
    <DashboardContent
      salesCount={sales.length}
      clientsCount={clients.length}
      productsCount={products.length}
      totalRevenue={sales.reduce((acc, s) => acc + Number(s.total), 0)}
      balance={ledger.balance}
      totalIn={ledger.totalIn}
      totalOut={ledger.totalOut}
      recentSales={sales.slice(0, 5)}
    />
  );
}
