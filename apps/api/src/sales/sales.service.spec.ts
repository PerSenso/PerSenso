import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-1',
  costPrice: 60,
};

const mockRestock = {
  id: 'restock-1',
  baseUnitCost: 60,
};

const mockSale = {
  id: 'sale-1',
  clientId: 'client-1',
  productId: 'prod-1',
  total: 100,
  unitCostAtSale: 60,
  profitAtSale: 40,
  marginPctAtSale: 40,
  date: new Date('2026-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTx = {
  restock: { findFirst: jest.fn() },
  product: { findUnique: jest.fn() },
  restock2: { findMany: jest.fn() },
  sale: { create: jest.fn(), findMany: jest.fn() },
  payment: { create: jest.fn() },
};

const mockPrisma = {
  sale: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  product: { findUnique: jest.fn() },
  restock: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  describe('financial snapshot calculation', () => {
    it('calculates profit snapshot correctly when restock exists', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.restock.findFirst.mockResolvedValue(mockRestock);
          mockTx.sale.create.mockResolvedValue(mockSale);
          return fn({
            restock: mockTx.restock,
            sale: mockTx.sale,
            payment: mockTx.payment,
            product: mockTx.product,
          });
        },
      );

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
      };

      await service.create(dto);

      expect(mockTx.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unitCostAtSale: 60,
            profitAtSale: 40,
            marginPctAtSale: 40,
          }),
        }),
      );
    });

    it('calculates margin as null when unitCost is 0', async () => {
      const zeroRestock = { id: 'r1', baseUnitCost: 0 };

      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.restock.findFirst.mockResolvedValue(zeroRestock);
          mockTx.sale.create.mockResolvedValue(mockSale);
          return fn({
            restock: mockTx.restock,
            sale: mockTx.sale,
            payment: mockTx.payment,
            product: mockTx.product,
          });
        },
      );

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
      };

      await service.create(dto);

      expect(mockTx.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unitCostAtSale: 0,
            profitAtSale: 100,
            marginPctAtSale: null,
          }),
        }),
      );
    });

    it('uses average cost when no restock available', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.restock.findFirst.mockResolvedValue(null);
          mockTx.product.findUnique.mockResolvedValue(mockProduct);
          mockTx.sale.create.mockResolvedValue(mockSale);
          return fn({
            restock: mockTx.restock,
            sale: mockTx.sale,
            payment: mockTx.payment,
            product: mockTx.product,
          });
        },
      );

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
      };

      await service.create(dto);

      expect(mockTx.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        select: { costPrice: true },
      });
    });

    it('rolls back sale if initial payment creation fails', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.restock.findFirst.mockResolvedValue(mockRestock);
          mockTx.sale.create.mockResolvedValue(mockSale);
          mockTx.payment.create.mockRejectedValue(new Error('payment failed'));
          return fn({
            restock: mockTx.restock,
            sale: mockTx.sale,
            payment: mockTx.payment,
            product: mockTx.product,
          });
        },
      );

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
        initialPayment: { amount: 50, method: 'efectivo' },
      };

      await expect(service.create(dto)).rejects.toThrow('payment failed');
    });
  });

  describe('findAll', () => {
    it('returns list of sales', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.sale.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if sale not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBalance', () => {
    it('returns balance with paid and pending amounts', async () => {
      const saleWithPayments = {
        ...mockSale,
        payments: [{ amount: 40 }, { amount: 10 }],
      };
      mockPrisma.sale.findUnique.mockResolvedValue(saleWithPayments);

      const result = await service.getBalance('sale-1');

      expect(result.total).toBe(100);
      expect(result.paid).toBe(50);
      expect(result.pending).toBe(50);
      expect(result.status).toBe('partial');
    });
  });
});
