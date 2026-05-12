import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const makeSale = (
  id: string,
  total: number,
  payments: { amount: number }[],
  clientName = 'Cliente Test',
  productName = 'Producto Test',
  date = new Date('2026-01-15'),
) => ({
  id,
  clientId: `client-${id}`,
  status: 'ACTIVA',
  total,
  date,
  client: { id: `client-${id}`, name: clientName },
  product: { id: `product-${id}`, name: productName },
  payments: payments.map((p, i) => ({
    id: `pay-${id}-${i}`,
    saleId: id,
    clientId: `client-${id}`,
    amount: p.amount,
    paymentMethod: 'efectivo',
    isInitial: i === 0,
    receiptUrl: null,
    date: new Date('2026-01-16'),
    notes: null,
    createdAt: new Date(),
  })),
});

const mockPrisma = {
  sale: { findMany: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ── getDebts ────────────────────────────────────────────────────────────────

  describe('getDebts', () => {
    it('returns only sales with pending > 0', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        makeSale('s1', 100, [{ amount: 50 }]), // pending 50
        makeSale('s2', 100, [{ amount: 100 }]), // pending 0 — excluded
        makeSale('s3', 80, []), // pending 80
      ]);

      const result = await service.getDebts();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('s1');
      expect(result[0].pending).toBe(50);
      expect(result[1].id).toBe('s3');
      expect(result[1].pending).toBe(80);
    });

    it('maps clientName and productName correctly', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        makeSale('s1', 100, [{ amount: 30 }], 'Juan Pérez', 'Sauvage'),
      ]);

      const result = await service.getDebts();

      expect(result[0].clientName).toBe('Juan Pérez');
      expect(result[0].productName).toBe('Sauvage');
    });

    it('includes payments in each debt', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        makeSale('s1', 100, [{ amount: 40 }, { amount: 20 }]),
      ]);

      const result = await service.getDebts();

      expect(result[0].payments).toHaveLength(2);
    });

    it('passes date filter to prisma when startDate given', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);

      await service.getDebts('2026-01-01', '2026-01-31');

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          }),
        }),
      );
    });

    it('does not include date filter when no dates given', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);

      await service.getDebts();

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVA' },
        }),
      );
    });
  });

  // ── getSalesStatus ──────────────────────────────────────────────────────────

  describe('getSalesStatus', () => {
    it('categorizes paid, partial and pending correctly', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        { ...makeSale('s1', 100, [{ amount: 100 }]) }, // paid
        { ...makeSale('s2', 100, [{ amount: 60 }]) }, // partial
        { ...makeSale('s3', 100, []) }, // pending
      ]);

      const result = await service.getSalesStatus();

      expect(result.paid).toEqual({ count: 1, total: 100 });
      expect(result.partial).toEqual({ count: 1, total: 100 });
      expect(result.pending).toEqual({ count: 1, total: 100 });
    });

    it('sums totals correctly across multiple sales per category', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        makeSale('s1', 200, [{ amount: 200 }]), // paid
        makeSale('s2', 150, [{ amount: 150 }]), // paid
        makeSale('s3', 100, []), // pending
      ]);

      const result = await service.getSalesStatus();

      expect(result.paid).toEqual({ count: 2, total: 350 });
      expect(result.pending).toEqual({ count: 1, total: 100 });
    });

    it('passes date filter to prisma', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);

      await service.getSalesStatus('2026-02-01');

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: new Date('2026-02-01') },
          }),
        }),
      );
    });
  });

  // ── getTopClients ───────────────────────────────────────────────────────────

  describe('getTopClients', () => {
    it('groups sales by client and sums totalPaid', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        {
          id: 's1',
          clientId: 'c1',
          client: { id: 'c1', name: 'Ana' },
          payments: [{ amount: 100 }],
        },
        {
          id: 's2',
          clientId: 'c1',
          client: { id: 'c1', name: 'Ana' },
          payments: [{ amount: 50 }],
        },
        {
          id: 's3',
          clientId: 'c2',
          client: { id: 'c2', name: 'Luis' },
          payments: [{ amount: 200 }],
        },
      ]);

      const result = await service.getTopClients();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        clientId: 'c2',
        name: 'Luis',
        totalPaid: 200,
        salesCount: 1,
      });
      expect(result[1]).toEqual({
        clientId: 'c1',
        name: 'Ana',
        totalPaid: 150,
        salesCount: 2,
      });
    });

    it('orders by totalPaid descending', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([
        {
          id: 's1',
          clientId: 'c1',
          client: { id: 'c1', name: 'Bajo' },
          payments: [{ amount: 10 }],
        },
        {
          id: 's2',
          clientId: 'c2',
          client: { id: 'c2', name: 'Alto' },
          payments: [{ amount: 500 }],
        },
      ]);

      const result = await service.getTopClients();

      expect(result[0].name).toBe('Alto');
      expect(result[1].name).toBe('Bajo');
    });

    it('returns empty array when no active sales', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);

      const result = await service.getTopClients();

      expect(result).toEqual([]);
    });

    it('passes date filter to prisma', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);

      await service.getTopClients(undefined, '2026-12-31');

      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { lte: new Date('2026-12-31') },
          }),
        }),
      );
    });
  });
});
