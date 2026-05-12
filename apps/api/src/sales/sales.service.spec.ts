import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

const mockRestock = { id: 'restock-1', baseUnitCost: 60 };

const mockSale = {
  id: 'sale-1',
  clientId: 'client-1',
  productId: 'prod-1',
  status: 'ACTIVA',
  total: 100,
  unitCostAtSale: 60,
  profitAtSale: 40,
  marginPctAtSale: 40,
  date: new Date('2026-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Product returned by the stock-check query (include: restocks + _count.sales)
const mockProductWithStock = {
  id: 'prod-1',
  costPrice: 60,
  restocks: [{ quantity: 5 }],
  _count: { sales: 2 }, // stock = 5 - 2 = 3 > 0
};

// Product with no stock
const mockProductNoStock = {
  id: 'prod-1',
  costPrice: 60,
  restocks: [{ quantity: 2 }],
  _count: { sales: 2 }, // stock = 2 - 2 = 0
};

const mockTx = {
  restock: { findFirst: jest.fn() },
  product: { findUnique: jest.fn() },
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

function makeTxWithStock(productWithStock = mockProductWithStock) {
  return async (fn: (tx: any) => any) => {
    // First call: stock validation query
    mockTx.product.findUnique.mockResolvedValueOnce(productWithStock);
    mockTx.restock.findFirst.mockResolvedValue(mockRestock);
    mockTx.sale.create.mockResolvedValue(mockSale);
    return fn({
      restock: mockTx.restock,
      sale: mockTx.sale,
      payment: mockTx.payment,
      product: mockTx.product,
    });
  };
}

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

  describe('anular', () => {
    it('marks sale as ANULADA', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(mockSale);
      mockPrisma.sale.update.mockResolvedValue({
        ...mockSale,
        status: 'ANULADA',
      });

      const result = await service.anular('sale-1');

      expect(mockPrisma.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ANULADA' } }),
      );
      expect(result.status).toBe('ANULADA');
    });

    it('throws BadRequestException if already ANULADA', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({
        ...mockSale,
        status: 'ANULADA',
      });

      await expect(service.anular('sale-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if sale not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.anular('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create — stock validation', () => {
    it('throws BadRequestException when stock is 0', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.product.findUnique.mockResolvedValueOnce(mockProductNoStock);
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

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockTx.sale.create).not.toHaveBeenCalled();
    });

    it('passes when stock > 0', async () => {
      mockPrisma.$transaction.mockImplementation(makeTxWithStock());

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
      };

      await service.create(dto);

      expect(mockTx.sale.create).toHaveBeenCalled();
    });

    it('queries stock filtering only ACTIVA sales', async () => {
      mockPrisma.$transaction.mockImplementation(makeTxWithStock());

      const dto = {
        clientId: 'client-1',
        productId: 'prod-1',
        total: 100,
        date: new Date('2026-01-01').toISOString(),
      };

      await service.create(dto);

      expect(mockTx.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          include: expect.objectContaining({
            _count: { select: { sales: { where: { status: 'ACTIVA' } } } },
          }),
        }),
      );
    });
  });

  describe('financial snapshot calculation', () => {
    it('calculates profit snapshot correctly when restock exists', async () => {
      mockPrisma.$transaction.mockImplementation(makeTxWithStock());

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
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.product.findUnique.mockResolvedValueOnce(mockProductWithStock);
          mockTx.restock.findFirst.mockResolvedValue({
            id: 'r1',
            baseUnitCost: 0,
          });
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
          mockTx.product.findUnique
            .mockResolvedValueOnce(mockProductWithStock) // stock check
            .mockResolvedValueOnce({ id: 'prod-1', costPrice: 60 }); // getProductCost
          mockTx.restock.findFirst.mockResolvedValue(null);
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
          mockTx.product.findUnique.mockResolvedValueOnce(mockProductWithStock);
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
