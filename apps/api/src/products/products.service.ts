import { Injectable, NotFoundException } from '@nestjs/common';
import { Gender } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(publishedOnly?: boolean) {
    return this.prisma.product.findMany({
      where: publishedOnly ? { isPublished: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
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
