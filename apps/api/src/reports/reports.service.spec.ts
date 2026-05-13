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

    const totalsRaw = [{ total_revenue: '2400', total_collected: '2150' }];

    const marginRaw = [
      { name: 'Sauvage', avg_margin_pct: '38.5' },
      { name: 'Bleu de Chanel', avg_margin_pct: '35.0' },
    ];

    const topClientsRaw = [
      { clientId: 'c1', name: 'Maria Lopez', total_spent: '1500', sales_count: '3' },
    ];

    const paymentsByMethodRaw = [
      { method: 'Zelle', total: '1200', count: '4' },
      { method: 'Efectivo', total: '950', count: '3' },
    ];

    function setupMocks(
      sbm = salesByMonthRaw,
      tp = topProductsRaw,
      totals = totalsRaw,
      margin = marginRaw,
      clients = topClientsRaw,
      payments = paymentsByMethodRaw,
    ) {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(sbm)
        .mockResolvedValueOnce(tp)
        .mockResolvedValueOnce(totals)
        .mockResolvedValueOnce(margin)
        .mockResolvedValueOnce(clients)
        .mockResolvedValueOnce(payments);
    }

    it('returns correctly mapped salesByMonth', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      expect(result.salesByMonth).toHaveLength(2);
      expect(result.salesByMonth[0].sales_count).toBe(5);
      expect(result.salesByMonth[0].revenue).toBe(1500);
      expect(result.salesByMonth[0].profit).toBe(600);
    });

    it('returns correctly mapped topProducts', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0].name).toBe('Sauvage');
      expect(result.topProducts[0].revenue).toBe(1200);
      expect(result.topProducts[0].avg_margin).toBe(38.5);
    });

    it('returns totalDebt as revenue minus collected', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      expect(result.totalRevenue).toBe(2400);
      expect(result.totalCollected).toBe(2150);
      expect(result.totalDebt).toBe(250);
    });

    it('returns topClients correctly mapped', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      expect(result.topClients).toHaveLength(1);
      expect(result.topClients[0].name).toBe('Maria Lopez');
      expect(result.topClients[0].totalSpent).toBe(1500);
      expect(result.topClients[0].salesCount).toBe(3);
    });

    it('returns paymentsByMethod correctly mapped', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      expect(result.paymentsByMethod).toHaveLength(2);
      expect(result.paymentsByMethod[0].method).toBe('Zelle');
      expect(result.paymentsByMethod[0].total).toBe(1200);
      expect(result.paymentsByMethod[0].count).toBe(4);
    });

    it('returns correct monthly revenue aggregation', async () => {
      setupMocks();
      const result = await service.getSummary(undefined, undefined);

      const totalRevenue = result.salesByMonth.reduce((acc, m) => acc + m.revenue, 0);
      expect(totalRevenue).toBe(2400);
    });

    it('handles empty database gracefully', async () => {
      setupMocks(
        [],
        [],
        [{ total_revenue: '0', total_collected: '0' }],
        [],
        [],
        [],
      );
      const result = await service.getSummary(undefined, undefined);

      expect(result.salesByMonth).toHaveLength(0);
      expect(result.topProducts).toHaveLength(0);
      expect(result.totalDebt).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalCollected).toBe(0);
      expect(result.topClients).toHaveLength(0);
      expect(result.paymentsByMethod).toHaveLength(0);
      expect(result.marginByProduct).toHaveLength(0);
    });

    it('handles null profit gracefully', async () => {
      const rawWithNullProfit = [
        { month: new Date('2026-01-01'), sales_count: '2', revenue: '500', profit: null as unknown as string },
      ];
      setupMocks(rawWithNullProfit);
      const result = await service.getSummary(undefined, undefined);

      expect(result.salesByMonth[0].profit).toBe(0);
    });

    it('accepts startDate and endDate without errors', async () => {
      setupMocks();
      const result = await service.getSummary('2026-01-01', '2026-01-31');

      expect(result.salesByMonth).toHaveLength(2);
      expect(result.topProducts).toHaveLength(2);
    });

    it('returns historical data without date params', async () => {
      setupMocks();
      const result = await service.getSummary();

      expect(result.salesByMonth).toHaveLength(2);
      expect(result.totalDebt).toBe(250);
    });
  });
});
