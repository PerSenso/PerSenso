import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { DashboardContent } from './DashboardContent';
import type {
  DashboardDebt,
  DashboardSalesStatus,
  DashboardTopClient,
} from '@persenso/shared';

export default async function DashboardPage() {
  let sales: import('@persenso/shared').Sale[];
  let clients: import('@persenso/shared').Client[];
  let products: import('@persenso/shared').ProductAdmin[];
  let ledger: import('@persenso/shared').LedgerSummary;
  let debts: DashboardDebt[];
  let salesStatus: DashboardSalesStatus;
  let topClients: DashboardTopClient[];

  try {
    [sales, clients, products, ledger, debts, salesStatus, topClients] =
      await Promise.all([
        api.sales.list(),
        api.clients.list(),
        api.products.list(),
        api.ledger.get(),
        api.dashboard.debts(),
        api.dashboard.salesStatus(),
        api.dashboard.topClients(),
      ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    sales = [];
    clients = [];
    products = [];
    ledger = { totalIn: 0, totalOut: 0, balance: 0, paymentsByMethod: [], movements: [] };
    debts = [];
    salesStatus = { paid: { count: 0, total: 0 }, partial: { count: 0, total: 0 }, pending: { count: 0, total: 0 } };
    topClients = [];
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
      recentSales={sales.slice(0, 20)}
      initialDebts={debts}
      initialSalesStatus={salesStatus}
      initialTopClients={topClients}
    />
  );
}
