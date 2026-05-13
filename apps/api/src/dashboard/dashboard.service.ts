import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private buildDateWhere(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return {};
    return {
      date: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
    };
  }

  async getDebts(startDate?: string, endDate?: string) {
    const sales = await this.prisma.sale.findMany({
      where: { status: 'ACTIVA', ...this.buildDateWhere(startDate, endDate) },
      include: {
        client: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        payments: { orderBy: { date: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });

    return sales
      .map((s) => {
        const total = Number(s.total);
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const pending = Math.max(0, total - paid);
        return {
          id: s.id,
          clientName: s.client.name,
          productName: s.product.name,
          date: s.date.toISOString(),
          total,
          paid,
          pending,
          payments: s.payments.map((p) => ({
            id: p.id,
            saleId: p.saleId,
            clientId: p.clientId,
            amount: Number(p.amount),
            paymentMethod: p.paymentMethod,
            isInitial: p.isInitial,
            receiptUrl: p.receiptUrl ?? undefined,
            date: p.date.toISOString(),
            notes: p.notes ?? undefined,
            createdAt: p.createdAt.toISOString(),
          })),
        };
      })
      .filter((s) => s.pending > 0);
  }

  async getSalesStatus(startDate?: string, endDate?: string) {
    const sales = await this.prisma.sale.findMany({
      where: { status: 'ACTIVA', ...this.buildDateWhere(startDate, endDate) },
      include: { payments: { select: { amount: true } } },
    });

    const result = {
      paid: { count: 0, total: 0 },
      partial: { count: 0, total: 0 },
      pending: { count: 0, total: 0 },
    };

    for (const s of sales) {
      const total = Number(s.total);
      const paidSum = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (paidSum >= total) {
        result.paid.count++;
        result.paid.total += total;
      } else if (paidSum > 0) {
        result.partial.count++;
        result.partial.total += total;
      } else {
        result.pending.count++;
        result.pending.total += total;
      }
    }

    return result;
  }

  async getSummary(startDate?: string, endDate?: string) {
    const dateWhere = this.buildDateWhere(startDate, endDate);

    const [sales, recentSales, payments, manualIn, manualOut] =
      await Promise.all([
        this.prisma.sale.findMany({
          where: { status: 'ACTIVA', ...dateWhere },
          select: { total: true },
        }),
        this.prisma.sale.findMany({
          where: { status: 'ACTIVA', ...dateWhere },
          include: {
            client: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
            payments: true,
          },
          orderBy: { date: 'desc' },
          take: 20,
        }),
        this.prisma.payment.aggregate({
          where: dateWhere ? { date: (dateWhere as any).date } : {},
          _sum: { amount: true },
        }),
        this.prisma.cashMovement.aggregate({
          where: { type: 'ingreso', ...dateWhere },
          _sum: { amount: true },
        }),
        this.prisma.cashMovement.aggregate({
          where: { type: 'retiro', ...dateWhere },
          _sum: { amount: true },
        }),
      ]);

    const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
    const totalIn =
      Number(payments._sum.amount ?? 0) + Number(manualIn._sum.amount ?? 0);
    const totalOut = Number(manualOut._sum.amount ?? 0);

    return {
      salesCount: sales.length,
      totalRevenue,
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      recentSales: recentSales.map((s) => ({
        ...s,
        total: Number(s.total),
        date: s.date.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        payments: s.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
          date: p.date.toISOString(),
          createdAt: p.createdAt.toISOString(),
        })),
      })),
    };
  }

  async getTopClients(startDate?: string, endDate?: string) {
    const sales = await this.prisma.sale.findMany({
      where: { status: 'ACTIVA', ...this.buildDateWhere(startDate, endDate) },
      include: {
        client: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
    });

    const map = new Map<
      string,
      { clientId: string; name: string; totalPaid: number; salesCount: number }
    >();

    for (const s of sales) {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const existing = map.get(s.clientId);
      if (existing) {
        existing.totalPaid += paid;
        existing.salesCount++;
      } else {
        map.set(s.clientId, {
          clientId: s.clientId,
          name: s.client.name,
          totalPaid: paid,
          salesCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalPaid - a.totalPaid);
  }
}
