import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

const mockOrder = {
  id: 'order-uuid-1',
  date: new Date('2026-01-01'),
  supplierId: 'sup-uuid-1',
  shippingCost: 50,
  marketingCost: 20,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  restocks: [],
  fundingEntries: [],
  supplier: null,
};

const mockTx = {
  order: { create: jest.fn(), findUnique: jest.fn() },
  restock: { create: jest.fn() },
  fundingEntry: { create: jest.fn() },
};

const mockPrisma = {
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns list of orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns order when found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-uuid-1');

      expect(result).toEqual(mockOrder);
    });

    it('throws NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates order with restocks and funding entries in a single transaction', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.order.create.mockResolvedValue(mockOrder);
          mockTx.restock.create.mockResolvedValue({});
          mockTx.fundingEntry.create.mockResolvedValue({});
          mockTx.order.findUnique.mockResolvedValue(mockOrder);
          return fn(mockTx);
        },
      );

      const dto = {
        date: '2026-01-01T00:00:00.000Z',
        restocks: [
          { productId: 'prod-uuid-1', quantity: 10, baseUnitCost: 50 },
        ],
        fundingEntries: [
          { investor: 'Angel', method: 'transferencia', amount: 500 },
        ],
      };

      const result = await service.create(dto);

      expect(mockTx.order.create).toHaveBeenCalled();
      expect(mockTx.restock.create).toHaveBeenCalledTimes(1);
      expect(mockTx.fundingEntry.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrder);
    });

    it('creates order with multiple restocks', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.order.create.mockResolvedValue(mockOrder);
          mockTx.restock.create.mockResolvedValue({});
          mockTx.order.findUnique.mockResolvedValue(mockOrder);
          return fn(mockTx);
        },
      );

      const dto = {
        date: '2026-01-01T00:00:00.000Z',
        restocks: [
          { productId: 'prod-1', quantity: 5, baseUnitCost: 40 },
          { productId: 'prod-2', quantity: 3, baseUnitCost: 60 },
        ],
      };

      await service.create(dto);

      expect(mockTx.restock.create).toHaveBeenCalledTimes(2);
    });

    it('rolls back entire order if a restock line fails', async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: any) => any) => {
          mockTx.order.create.mockResolvedValue(mockOrder);
          mockTx.restock.create
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(new Error('restock failed'));
          return fn(mockTx);
        },
      );

      const dto = {
        date: '2026-01-01T00:00:00.000Z',
        restocks: [
          { productId: 'prod-1', quantity: 5, baseUnitCost: 40 },
          { productId: 'prod-bad', quantity: 3, baseUnitCost: 60 },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow('restock failed');
    });
  });

  describe('update', () => {
    it('updates order metadata', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        notes: 'updated',
      });

      const result = await service.update('order-uuid-1', { notes: 'updated' });

      expect(result.notes).toBe('updated');
    });

    it('throws NotFoundException when updating non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.delete.mockResolvedValue(mockOrder);

      const result = await service.remove('order-uuid-1');

      expect(result).toEqual(mockOrder);
    });

    it('throws NotFoundException when removing non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
