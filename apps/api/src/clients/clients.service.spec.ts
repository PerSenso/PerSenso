import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

const mockClient = {
  id: 'client-1',
  name: 'Ana Torres',
  ci: null,
  phone: null,
  address: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  client: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sale: { count: jest.fn() },
  payment: { count: jest.fn() },
  $queryRaw: jest.fn(),
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  describe('remove', () => {
    it('deletes client when no sales or payments exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.sale.count.mockResolvedValue(0);
      mockPrisma.payment.count.mockResolvedValue(0);
      mockPrisma.client.delete.mockResolvedValue(mockClient);

      const result = await service.remove('client-1');

      expect(mockPrisma.client.delete).toHaveBeenCalledWith({
        where: { id: 'client-1' },
      });
      expect(result).toEqual(mockClient);
    });

    it('throws BadRequestException when client has any sales', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.sale.count.mockResolvedValue(2);
      mockPrisma.payment.count.mockResolvedValue(0);

      await expect(service.remove('client-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.client.delete).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when client has payments', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.sale.count.mockResolvedValue(0);
      mockPrisma.payment.count.mockResolvedValue(3);

      await expect(service.remove('client-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.client.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when client does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
