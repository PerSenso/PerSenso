import { Injectable, NotFoundException } from '@nestjs/common';
import { Gender } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(publishedOnly?: boolean) {
    const products = await this.prisma.product.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      include: {
        restocks: { select: { quantity: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => {
      const totalRestocked =
        p.restocks?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
      const totalSold = p._count?.sales ?? 0;
      const rest = { ...p } as any;
      delete rest.restocks;
      delete rest._count;
      return {
        ...rest,
        stock: totalRestocked - totalSold,
      };
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        restocks: { select: { quantity: true } },
        _count: { select: { sales: true } },
      },
    });
    if (!p) throw new NotFoundException('Producto no encontrado');

    const totalRestocked =
      p.restocks?.reduce((sum, r) => sum + r.quantity, 0) ?? 0;
    const totalSold = p._count?.sales ?? 0;
    const rest = { ...p } as any;
    delete rest.restocks;
    delete rest._count;

    return {
      ...rest,
      stock: totalRestocked - totalSold,
    };
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        gender: dto.gender as Gender | undefined,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto | { imageUrl: string }) {
    await this.findOne(id);
    const data =
      'imageUrl' in dto
        ? dto
        : {
            ...dto,
            gender: (dto as UpdateProductDto).gender as Gender | undefined,
          };
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
