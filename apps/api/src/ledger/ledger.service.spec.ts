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
    update: jest.fn(),
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

  describe('updateMovement', () => {
    it('updates a movement when found', async () => {
      const updated = { ...mockMovements[0], amount: 200 };
      mockPrisma.cashMovement.findUnique.mockResolvedValue(mockMovements[0]);
      mockPrisma.cashMovement.update.mockResolvedValue(updated);

      const result = await service.updateMovement('mov-1', { amount: 200 });

      expect(result).toEqual(updated);
      expect(mockPrisma.cashMovement.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mov-1' } }),
      );
    });

    it('throws NotFoundException when movement not found', async () => {
      mockPrisma.cashMovement.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMovement('missing', { amount: 50 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates owner and paymentMethod fields', async () => {
      const updated = {
        ...mockMovements[0],
        owner: 'Carlos',
        paymentMethod: 'Zelle',
      };
      mockPrisma.cashMovement.findUnique.mockResolvedValue(mockMovements[0]);
      mockPrisma.cashMovement.update.mockResolvedValue(updated);

      const result = await service.updateMovement('mov-1', {
        owner: 'Carlos',
        paymentMethod: 'Zelle',
      });

      expect(result.owner).toBe('Carlos');
      expect(result.paymentMethod).toBe('Zelle');
    });

    it('only updates provided fields', async () => {
      mockPrisma.cashMovement.findUnique.mockResolvedValue(mockMovements[0]);
      mockPrisma.cashMovement.update.mockResolvedValue(mockMovements[0]);

      await service.updateMovement('mov-1', { source: 'nuevo origen' });

      expect(mockPrisma.cashMovement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { source: 'nuevo origen' },
        }),
      );
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

  describe('getContributions', () => {
    it('returns investor contributions grouped by investor', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { investor: 'Carlos', total: '1500', count: '3' },
        { investor: 'Beto', total: '800', count: '2' },
      ]);

      const result = await service.getContributions();

      expect(result).toHaveLength(2);
      expect(result[0].investor).toBe('Carlos');
      expect(result[0].totalContributed).toBe(1500);
      expect(result[0].ordersCount).toBe(3);
    });

    it('returns empty array when no funding entries', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getContributions();

      expect(result).toHaveLength(0);
    });
  });
});
