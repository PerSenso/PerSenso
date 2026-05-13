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

    const [salesByMonth, topProducts, debtRows, marginByProduct] =
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
          LIMIT 10
        `,
        this.prisma.$queryRaw<{ total_debt: string }[]>`
          SELECT
            (SELECT COALESCE(SUM(total), 0) FROM "Sale" ${debtSaleFilter}) -
            (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p ${debtPayFilter}) AS total_debt
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
      ]);

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
      totalDebt: Number(debtRows[0]?.total_debt ?? 0),
      marginByProduct: marginByProduct.map((r) => ({
        name: r.name,
        avg_margin_pct: Number(r.avg_margin_pct),
      })),
    };
  }
}
