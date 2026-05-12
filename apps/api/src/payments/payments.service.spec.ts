import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPayment = {
  id: 'pay-1',
  saleId: 'sale-1',
  clientId: 'client-1',
  amount: 50,
  paymentMethod: 'Efectivo',
  isInitial: false,
  receiptUrl: null,
  date: new Date('2026-01-10'),
  notes: null,
  createdAt: new Date(),
};

const mockSaleWithPayments = {
  id: 'sale-1',
  status: 'ACTIVA',
  total: 100,
  date: new Date('2026-01-01'),
  notes: null,
  clientId: 'client-1',
  productId: 'prod-1',
  client: { id: 'client-1', name: 'Ana Torres' },
  product: { id: 'prod-1', name: 'Chanel No. 5' },
  payments: [{ ...mockPayment, amount: 30 }],
};

const mockPrisma = {
  payment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sale: {
    findMany: jest.fn(),
  },
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('findSalesWithDebt', () => {
    it('returns only sales with pending balance', async () => {
      const fullyPaidSale = {
        ...mockSaleWithPayments,
        id: 'sale-2',
        total: 100,
        payments: [{ ...mockPayment, amount: 100 }],
      };
      mockPrisma.sale.findMany.mockResolvedValue([
        mockSaleWithPayments,
        fullyPaidSale,
      ]);

      const result = await service.findSalesWithDebt();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sale-1');
      expect(result[0].pending).toBe(70);
      expect(result[0].paid).toBe(30);
    });

    it('returns empty array when no debts exist', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([]);
      const result = await service.findSalesWithDebt();
      expect(result).toEqual([]);
    });

    it('includes client and product names', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([mockSaleWithPayments]);
      const result = await service.findSalesWithDebt();
      expect(result[0].client.name).toBe('Ana Torres');
      expect(result[0].product.name).toBe('Chanel No. 5');
    });
  });

  describe('findBySale', () => {
    it('returns payments for a given saleId', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
      const result = await service.findBySale('sale-1');
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { saleId: 'sale-1' } }),
      );
      expect(result).toEqual([mockPayment]);
    });
  });

  describe('remove', () => {
    it('deletes payment when it exists', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrisma.payment.delete.mockResolvedValue(mockPayment);
      await service.remove('pay-1');
      expect(mockPrisma.payment.delete).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
      });
    });

    it('throws NotFoundException when payment does not exist', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
