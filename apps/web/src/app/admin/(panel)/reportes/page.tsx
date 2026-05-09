import { api } from '@/lib/api-client';
import { ReportesContent } from './ReportesContent';

export default async function ReportesPage() {
  let reports: import('@persenso/shared').ReportsSummary;

  try {
    reports = await api.reports.summary();
  } catch {
    reports = { salesByMonth: [], topProducts: [], totalDebt: 0, marginByProduct: [] };
  }

  return <ReportesContent reports={reports} />;
}
