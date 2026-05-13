import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(startDate?: string, endDate?: string) {
    const hasFilter = Boolean(startDate && endDate);
    const start = hasFilter ? new Date(startDate!) : null;
    const end = hasFilter ? new Date(endDate!) : null;

    // end of day so the endDate is inclusive
    const endEod = hasFilter ? new Date(end!.getTime() + 86399999) : null;

    const dateWhere = hasFilter
      ? Prisma.sql`WHERE date >= ${start} AND date <= ${endEod}`
      : Prisma.sql``;
    const sDateWhere = hasFilter
      ? Prisma.sql`WHERE s.date >= ${start} AND s.date <= ${endEod}`
      : Prisma.sql``;
    const sDateAnd = hasFilter
      ? Prisma.sql`AND s.date >= ${start} AND s.date <= ${endEod}`
      : Prisma.sql``;
    const debtSaleFilter = hasFilter
      ? Prisma.sql`WHERE date >= ${start} AND date <= ${endEod}`
      : Prisma.sql``;
    const debtPayFilter = hasFilter
      ? Prisma.sql`JOIN "Sale" sf ON sf.id = p."saleId" WHERE sf.date >= ${start} AND sf.date <= ${endEod}`
      : Prisma.sql``;

    const [salesByMonth, topProducts, totalsRow, marginByProduct, topClients, paymentsByMethod] =
      await Promise.all([
        this.prisma.$queryRaw<
          {
            month: Date;
            sales_count: string;
            revenue: string;
            profit: string;
          }[]
        >`
          SELECT
            DATE_TRUNC('month', date) AS month,
            COUNT(*) AS sales_count,
            SUM(total) AS revenue,
            SUM("profitAtSale") AS profit
          FROM "Sale"
          ${dateWhere}
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY month DESC
          LIMIT 12
        `,
        this.prisma.$queryRaw<
          {
            name: string;
            sales_count: string;
            revenue: string;
            avg_margin: string;
          }[]
        >`
          SELECT
            p.name,
            COUNT(s.id) AS sales_count,
            SUM(s.total) AS revenue,
            AVG(s."marginPctAtSale") AS avg_margin
          FROM "Sale" s
          JOIN "Product" p ON p.id = s."productId"
          ${sDateWhere}
          GROUP BY p.id, p.name
          ORDER BY SUM(s.total) DESC
        `,
        this.prisma.$queryRaw<{ total_revenue: string; total_collected: string }[]>`
          SELECT
            (SELECT COALESCE(SUM(total), 0) FROM "Sale" ${debtSaleFilter}) AS total_revenue,
            (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p ${debtPayFilter}) AS total_collected
        `,
        this.prisma.$queryRaw<{ name: string; avg_margin_pct: string }[]>`
          SELECT
            p.name,
            AVG(s."marginPctAtSale") AS avg_margin_pct
          FROM "Sale" s
          JOIN "Product" p ON p.id = s."productId"
          WHERE s."marginPctAtSale" IS NOT NULL ${sDateAnd}
          GROUP BY p.id, p.name
          ORDER BY AVG(s."marginPctAtSale") DESC
        `,
        this.prisma.$queryRaw<
          { clientId: string; name: string; total_spent: string; sales_count: string }[]
        >`
          SELECT
            c.id AS "clientId",
            c.name,
            SUM(s.total) AS total_spent,
            COUNT(s.id) AS sales_count
          FROM "Sale" s
          JOIN "Client" c ON c.id = s."clientId"
          ${sDateWhere}
          GROUP BY c.id, c.name
          ORDER BY SUM(s.total) DESC
          LIMIT 10
        `,
        this.prisma.$queryRaw<{ method: string; total: string; count: string }[]>`
          SELECT
            p."paymentMethod" AS method,
            SUM(p.amount) AS total,
            COUNT(p.id) AS count
          FROM "Payment" p
          JOIN "Sale" s ON s.id = p."saleId" ${sDateAnd}
          GROUP BY p."paymentMethod"
          ORDER BY SUM(p.amount) DESC
        `,
      ]);

    const totalRevenue = Number(totalsRow[0]?.total_revenue ?? 0);
    const totalCollected = Number(totalsRow[0]?.total_collected ?? 0);

    return {
      salesByMonth: salesByMonth.map((r) => ({
        month: r.month,
        sales_count: Number(r.sales_count),
        revenue: Number(r.revenue),
        profit: Number(r.profit ?? 0),
      })),
      topProducts: topProducts.map((r) => ({
        name: r.name,
        sales_count: Number(r.sales_count),
        revenue: Number(r.revenue),
        avg_margin: Number(r.avg_margin ?? 0),
      })),
      totalDebt: totalRevenue - totalCollected,
      totalRevenue,
      totalCollected,
      marginByProduct: marginByProduct.map((r) => ({
        name: r.name,
        avg_margin_pct: Number(r.avg_margin_pct),
      })),
      topClients: topClients.map((r) => ({
        clientId: r.clientId,
        name: r.name,
        totalSpent: Number(r.total_spent),
        salesCount: Number(r.sales_count),
      })),
      paymentsByMethod: paymentsByMethod.map((r) => ({
        method: r.method,
        total: Number(r.total),
        count: Number(r.count),
      })),
    };
  }
}
