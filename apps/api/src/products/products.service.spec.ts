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
    it('should return all products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should filter published products when flag is true', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      await service.findAll(true);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-uuid-1');

      expect(result).toEqual(mockProduct);
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
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
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
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('prod-uuid-1');

      expect(result).toEqual(mockProduct);
    });
  });
});
