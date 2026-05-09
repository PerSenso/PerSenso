import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSupplier = {
  id: 'sup-uuid-1',
  name: 'Proveedor A',
  phone: '0412-1234567',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  supplier: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('SuppliersService', () => {
  let service: SuppliersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns list of suppliers ordered by name', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([mockSupplier]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns supplier when found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);

      const result = await service.findOne('sup-uuid-1');

      expect(result).toEqual(mockSupplier);
    });

    it('throws NotFoundException when supplier not found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBalance', () => {
    it('returns totalInvested and totalCosts for a valid supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.$queryRaw.mockResolvedValue([
        { total_invested: '5000', total_costs: '200' },
      ]);

      const result = await service.getBalance('sup-uuid-1');

      expect(result.totalInvested).toBe(5000);
      expect(result.totalCosts).toBe(200);
      expect(result.supplierId).toBe('sup-uuid-1');
    });

    it('returns zeros when supplier has no orders', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.$queryRaw.mockResolvedValue([
        { total_invested: '0', total_costs: '0' },
      ]);

      const result = await service.getBalance('sup-uuid-1');

      expect(result.totalInvested).toBe(0);
      expect(result.totalCosts).toBe(0);
    });

    it('throws NotFoundException when supplier not found', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a supplier', async () => {
      mockPrisma.supplier.create.mockResolvedValue(mockSupplier);

      const result = await service.create({ name: 'Proveedor A' });

      expect(result).toEqual(mockSupplier);
      expect(mockPrisma.supplier.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.supplier.update.mockResolvedValue({
        ...mockSupplier,
        name: 'Nuevo Nombre',
      });

      const result = await service.update('sup-uuid-1', {
        name: 'Nuevo Nombre',
      });

      expect(result.name).toBe('Nuevo Nombre');
    });

    it('throws NotFoundException when updating non-existent supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes a supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockSupplier);
      mockPrisma.supplier.delete.mockResolvedValue(mockSupplier);

      const result = await service.remove('sup-uuid-1');

      expect(result).toEqual(mockSupplier);
    });

    it('throws NotFoundException when removing non-existent supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
