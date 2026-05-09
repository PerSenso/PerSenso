import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-uuid-1',
  name: 'Sauvage',
  brand: 'Dior',
  costPrice: 80,
  salePrice: 150,
  isPublished: true,
  gender: 'HOMBRE',
};

// findAll/findOne now include restocks + _count to compute stock
const mockProductWithRelations = {
  ...mockProduct,
  restocks: [{ quantity: 10 }, { quantity: 5 }],
  _count: { sales: 3 },
};

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return products with computed stock', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProductWithRelations]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      // stock = sum(restocks.quantity) - _count.sales = (10+5) - 3 = 12
      expect(result[0].stock).toBe(12);
      expect(result[0]).not.toHaveProperty('_count');
      expect(result[0]).not.toHaveProperty('restocks');
    });

    it('should pass isPublished filter when publishedOnly is true', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findAll(true);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true } }),
      );
    });

    it('should not filter when publishedOnly is false', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product with computed stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProductWithRelations);

      const result = await service.findOne('prod-uuid-1');

      expect(result.id).toBe('prod-uuid-1');
      expect(result.stock).toBe(12);
      expect(result).not.toHaveProperty('_count');
      expect(result).not.toHaveProperty('restocks');
    });

    it('should return stock = 0 when no restocks exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        restocks: [],
        _count: { sales: 0 },
      });

      const result = await service.findOne('prod-uuid-1');

      expect(result.stock).toBe(0);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const dto = { name: 'Sauvage', costPrice: 80, salePrice: 150 } as any;
      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProductWithRelations);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated',
      });

      const result = await service.update('prod-uuid-1', {
        imageUrl: 'http://img.url',
      });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { imageUrl: 'url' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProductWithRelations);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-uuid-1');

      expect(result).toEqual(mockProduct);
    });
  });
});
