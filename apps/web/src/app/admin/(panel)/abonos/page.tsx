import { api, ApiError } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import { AbonosContent } from './AbonosContent';

export default async function AbonosPage() {
  try {
    const salesWithDebt = await api.payments.salesWithDebt();
    return <AbonosContent salesWithDebt={salesWithDebt} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/admin/login');
    throw e;
  }
}
