import { cookies } from 'next/headers';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 
        'Authorization': `Bearer ${token}`,
        'Cookie': `access_token=${token}` 
      } : {}),
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ApiError(res.status, detail || `API error ${res.status}: ${path}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Client-side fetch (for use in client components via server actions)
export async function apiMutate<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, options);
}

export const api = {
  // Auth
  auth: {
    login: (data: { username: string; password: string }) =>
      apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Products
  products: {
    list: () => apiFetch<import('@persenso/shared').ProductAdmin[]>('/products'),
    getById: (id: string) =>
      apiFetch<import('@persenso/shared').ProductAdmin>(`/products/${id}`),
    create: (data: import('@persenso/shared').CreateProductInput) =>
      apiFetch<import('@persenso/shared').ProductAdmin>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import('@persenso/shared').UpdateProductInput) =>
      apiFetch<import('@persenso/shared').ProductAdmin>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  // Sales
  sales: {
    list: () => apiFetch<import('@persenso/shared').Sale[]>('/sales'),
    getById: (id: string) =>
      apiFetch<import('@persenso/shared').Sale>(`/sales/${id}`),
    getBalance: (id: string) =>
      apiFetch<{ total: number; paid: number; pending: number; status: string }>(
        `/sales/${id}/balance`,
      ),
    create: (data: import('@persenso/shared').CreateSaleInput) =>
      apiFetch<import('@persenso/shared').Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import('@persenso/shared').UpdateSaleInput) =>
      apiFetch<import('@persenso/shared').Sale>(`/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/sales/${id}`, { method: 'DELETE' }),
  },

  // Payments
  payments: {
    list: (saleId?: string) =>
      apiFetch<import('@persenso/shared').Payment[]>(
        saleId ? `/payments?saleId=${saleId}` : '/payments',
      ),
    salesWithDebt: () =>
      apiFetch<import('@persenso/shared').SaleWithDebt[]>('/payments/sales-with-debt'),
    create: (data: import('@persenso/shared').CreatePaymentInput) =>
      apiFetch<import('@persenso/shared').Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/payments/${id}`, { method: 'DELETE' }),
  },

  // Clients
  clients: {
    list: () => apiFetch<import('@persenso/shared').Client[]>('/clients'),
    listWithDebt: () =>
      apiFetch<import('@persenso/shared').ClientWithDebt[]>('/clients/with-debt'),
    getById: (id: string) =>
      apiFetch<import('@persenso/shared').Client>(`/clients/${id}`),
    getDebt: (id: string) =>
      apiFetch<{ totalDebt: number }>(`/clients/${id}/debt`),
    create: (data: import('@persenso/shared').CreateClientInput) =>
      apiFetch<import('@persenso/shared').Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import('@persenso/shared').UpdateClientInput) =>
      apiFetch<import('@persenso/shared').Client>(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/clients/${id}`, { method: 'DELETE' }),
  },

  // Orders
  orders: {
    list: () => apiFetch<import('@persenso/shared').Order[]>('/orders'),
    getById: (id: string) =>
      apiFetch<import('@persenso/shared').Order>(`/orders/${id}`),
    create: (data: import('@persenso/shared').CreateOrderInput) =>
      apiFetch<import('@persenso/shared').Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import('@persenso/shared').UpdateOrderInput) =>
      apiFetch<import('@persenso/shared').Order>(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/orders/${id}`, { method: 'DELETE' }),
  },

  // Suppliers
  suppliers: {
    list: () => apiFetch<import('@persenso/shared').Supplier[]>('/suppliers'),
    getById: (id: string) =>
      apiFetch<import('@persenso/shared').Supplier>(`/suppliers/${id}`),
    create: (data: import('@persenso/shared').CreateSupplierInput) =>
      apiFetch<import('@persenso/shared').Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import('@persenso/shared').UpdateSupplierInput) =>
      apiFetch<import('@persenso/shared').Supplier>(`/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/suppliers/${id}`, { method: 'DELETE' }),
  },

  // Ledger
  ledger: {
    get: () => apiFetch<import('@persenso/shared').LedgerSummary>('/ledger'),
    getContributions: () =>
      apiFetch<import('@persenso/shared').FundingContribution[]>('/ledger/contributions'),
    createMovement: (data: import('@persenso/shared').CreateMovementInput) =>
      apiFetch<import('@persenso/shared').CashMovement>('/ledger/movements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteMovement: (id: string) =>
      apiFetch<void>(`/ledger/movements/${id}`, { method: 'DELETE' }),
  },

  // Reports
  reports: {
    summary: () =>
      apiFetch<import('@persenso/shared').ReportsSummary>('/reports/summary'),
  },

  // Users (OWNER only)
  users: {
    list: () => apiFetch<{ id: string; username: string; role: string; isActive: boolean; createdAt: string }[]>('/users'),
    create: (data: { username: string; password: string; role: 'ADMIN' | 'OWNER' }) =>
      apiFetch<{ id: string; username: string; role: string; isActive: boolean; createdAt: string }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Dashboard
  dashboard: {
    debts: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();
      return apiFetch<import('@persenso/shared').DashboardDebt[]>(
        `/dashboard/debts${qs ? `?${qs}` : ''}`,
      );
    },
    salesStatus: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();
      return apiFetch<import('@persenso/shared').DashboardSalesStatus>(
        `/dashboard/sales-status${qs ? `?${qs}` : ''}`,
      );
    },
    topClients: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();
      return apiFetch<import('@persenso/shared').DashboardTopClient[]>(
        `/dashboard/top-clients${qs ? `?${qs}` : ''}`,
      );
    },
  },
};
