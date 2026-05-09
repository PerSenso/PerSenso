import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { ReportesContent } from './ReportesContent';

const EMPTY_REPORTS = { salesByMonth: [], topProducts: [], totalDebt: 0, marginByProduct: [] };

export default async function ReportesPage() {
  try {
    const reports = await api.reports.summary();
    return <ReportesContent reports={reports} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    return <ReportesContent reports={EMPTY_REPORTS} />;
  }
}
