import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';

const mockMovements = [
  {
    id: 'mov-1',
    type: 'retiro',
    source: 'gastos',
    method: 'efectivo',
    amount: 100,
    date: new Date(),
    notes: null,
    createdAt: new Date(),
  },
  {
    id: 'mov-2',
    type: 'ingreso',
    source: 'capital',
    method: 'transferencia',
    amount: 500,
    date: new Date(),
    notes: null,
    createdAt: new Date(),
  },
];

const mockPrisma = {
  cashMovement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
    jest.clearAllMocks();
  });

  describe('getUnifiedCash', () => {
    it('calculates totalIn as sum of all payments', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { method: 'efectivo', total: '800', count: '3' },
          { method: 'transferencia', total: '1200', count: '2' },
        ])
        .mockResolvedValueOnce([{ total: '500' }]);
      mockPrisma.cashMovement.findMany.mockResolvedValue([]);

      const result = await service.getUnifiedCash();

      expect(result.totalIn).toBe(2000);
    });

    it('calculates totalOut as restock costs plus retiro movements', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { method: 'efectivo', total: '3000', count: '5' },
        ])
        .mockResolvedValueOnce([{ total: '1000' }]);
      mockPrisma.cashMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.getUnifiedCash();

      expect(result.totalOut).toBe(1100);
    });

    it('calculates correct balance', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { method: 'efectivo', total: '3000', count: '5' },
        ])
        .mockResolvedValueOnce([{ total: '1000' }]);
      mockPrisma.cashMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.getUnifiedCash();

      expect(result.balance).toBe(result.totalIn - result.totalOut);
    });

    it('includes movements in the response', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: '0' }]);
      mockPrisma.cashMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.getUnifiedCash();

      expect(result.movements).toHaveLength(2);
    });

    it('handles empty database with zeros', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: '0' }]);
      mockPrisma.cashMovement.findMany.mockResolvedValue([]);

      const result = await service.getUnifiedCash();

      expect(result.totalIn).toBe(0);
      expect(result.totalOut).toBe(0);
      expect(result.balance).toBe(0);
    });
  });

  describe('createMovement', () => {
    it('creates a cash movement', async () => {
      const movement = { ...mockMovements[0] };
      mockPrisma.cashMovement.create.mockResolvedValue(movement);

      const dto = {
        type: 'retiro',
        source: 'gastos',
        method: 'efectivo',
        amount: 100,
        date: new Date().toISOString(),
      };

      const result = await service.createMovement(dto);

      expect(result).toEqual(movement);
      expect(mockPrisma.cashMovement.create).toHaveBeenCalled();
    });
  });

  describe('removeMovement', () => {
    it('deletes a movement', async () => {
      mockPrisma.cashMovement.findUnique.mockResolvedValue(mockMovements[0]);
      mockPrisma.cashMovement.delete.mockResolvedValue(mockMovements[0]);

      const result = await service.removeMovement('mov-1');

      expect(result).toEqual(mockMovements[0]);
    });

    it('throws NotFoundException when movement not found', async () => {
      mockPrisma.cashMovement.findUnique.mockResolvedValue(null);

      await expect(service.removeMovement('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
