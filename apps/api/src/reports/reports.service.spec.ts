import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    const salesByMonthRaw = [
      {
        month: new Date('2026-01-01'),
        sales_count: '5',
        revenue: '1500',
        profit: '600',
      },
      {
        month: new Date('2025-12-01'),
        sales_count: '3',
        revenue: '900',
        profit: '350',
      },
    ];

    const topProductsRaw = [
      {
        name: 'Sauvage',
        sales_count: '4',
        revenue: '1200',
        avg_margin: '38.5',
      },
      {
        name: 'Bleu de Chanel',
        sales_count: '2',
        revenue: '600',
        avg_margin: '35.0',
      },
    ];

    const debtRaw = [{ total_debt: '250' }];

    const marginRaw = [
      { name: 'Sauvage', avg_margin_pct: '38.5' },
      { name: 'Bleu de Chanel', avg_margin_pct: '35.0' },
    ];

    it('returns correctly mapped salesByMonth', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(salesByMonthRaw)
        .mockResolvedValueOnce(topProductsRaw)
        .mockResolvedValueOnce(debtRaw)
        .mockResolvedValueOnce(marginRaw);

      const result = await service.getSummary();

      expect(result.salesByMonth).toHaveLength(2);
      expect(result.salesByMonth[0].sales_count).toBe(5);
      expect(result.salesByMonth[0].revenue).toBe(1500);
      expect(result.salesByMonth[0].profit).toBe(600);
    });

    it('returns correctly mapped topProducts', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(salesByMonthRaw)
        .mockResolvedValueOnce(topProductsRaw)
        .mockResolvedValueOnce(debtRaw)
        .mockResolvedValueOnce(marginRaw);

      const result = await service.getSummary();

      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0].name).toBe('Sauvage');
      expect(result.topProducts[0].revenue).toBe(1200);
      expect(result.topProducts[0].avg_margin).toBe(38.5);
    });

    it('returns totalDebt as a number', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(salesByMonthRaw)
        .mockResolvedValueOnce(topProductsRaw)
        .mockResolvedValueOnce(debtRaw)
        .mockResolvedValueOnce(marginRaw);

      const result = await service.getSummary();

      expect(result.totalDebt).toBe(250);
    });

    it('returns correct monthly revenue aggregation', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(salesByMonthRaw)
        .mockResolvedValueOnce(topProductsRaw)
        .mockResolvedValueOnce(debtRaw)
        .mockResolvedValueOnce(marginRaw);

      const result = await service.getSummary();

      const totalRevenue = result.salesByMonth.reduce(
        (acc, m) => acc + m.revenue,
        0,
      );
      expect(totalRevenue).toBe(2400);
    });

    it('handles empty database gracefully', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total_debt: '0' }])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary();

      expect(result.salesByMonth).toHaveLength(0);
      expect(result.topProducts).toHaveLength(0);
      expect(result.totalDebt).toBe(0);
      expect(result.marginByProduct).toHaveLength(0);
    });

    it('handles null profit gracefully', async () => {
      const rawWithNullProfit = [
        {
          month: new Date('2026-01-01'),
          sales_count: '2',
          revenue: '500',
          profit: null,
        },
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(rawWithNullProfit)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total_debt: '0' }])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary();

      expect(result.salesByMonth[0].profit).toBe(0);
    });
  });
});
