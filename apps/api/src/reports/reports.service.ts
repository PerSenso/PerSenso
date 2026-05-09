import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
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
          GROUP BY p.id, p.name
          ORDER BY SUM(s.total) DESC
          LIMIT 10
        `,
        this.prisma.$queryRaw<{ total_debt: string }[]>`
          SELECT 
            (SELECT COALESCE(SUM(total), 0) FROM "Sale") - 
            (SELECT COALESCE(SUM(amount), 0) FROM "Payment") AS total_debt
        `,
        this.prisma.$queryRaw<{ name: string; avg_margin_pct: string }[]>`
          SELECT
            p.name,
            AVG(s."marginPctAtSale") AS avg_margin_pct
          FROM "Sale" s
          JOIN "Product" p ON p.id = s."productId"
          WHERE s."marginPctAtSale" IS NOT NULL
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
