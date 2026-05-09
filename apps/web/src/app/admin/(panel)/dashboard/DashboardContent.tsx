'use client';

import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ShoppingCart, Users, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { Sale } from '@persenso/shared';

interface DashboardContentProps {
  salesCount: number;
  clientsCount: number;
  productsCount: number;
  totalRevenue: number;
  balance: number;
  totalIn: number;
  totalOut: number;
  recentSales: Sale[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function DashboardContent({
  salesCount,
  clientsCount,
  productsCount,
  totalRevenue,
  balance,
  totalIn,
  totalOut,
  recentSales,
}: DashboardContentProps) {
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Resumen general del negocio"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard
          title="Ventas Totales"
          value={salesCount}
          subtitle={`${formatCurrency(totalRevenue)} en ingresos`}
          icon={ShoppingCart}
          color="gold"
        />
        <AdminStatCard
          title="Clientes"
          value={clientsCount}
          icon={Users}
          color="blue"
        />
        <AdminStatCard
          title="Productos"
          value={productsCount}
          icon={Package}
          color="green"
        />
        <AdminStatCard
          title="Balance Caja"
          value={formatCurrency(balance)}
          icon={DollarSign}
          color={balance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Income / Expense summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-persenso p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(76, 175, 125, 0.1)' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--ps-green)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                Ingresos
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--ps-green)' }}>
                {formatCurrency(totalIn)}
              </p>
            </div>
          </div>
        </div>

        <div className="card-persenso p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(224, 92, 92, 0.1)' }}
            >
              <TrendingDown className="w-4 h-4" style={{ color: 'var(--ps-red)' }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ps-text-muted)' }}>
                Egresos
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--ps-red)' }}>
                {formatCurrency(totalOut)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card-persenso p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--ps-text-muted)' }}>
          Últimas Ventas
        </h2>
        {recentSales.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--ps-text-muted)' }}>
            No hay ventas registradas
          </p>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                style={{ borderBottom: '1px solid var(--ps-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ps-text)' }}>
                    {sale.product?.name || 'Producto'} — #{sale.id.slice(0, 8)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ps-text-muted)' }}>
                    {new Date(sale.date).toLocaleDateString('es-VE')}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ps-gold)' }}>
                  {formatCurrency(Number(sale.total))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
