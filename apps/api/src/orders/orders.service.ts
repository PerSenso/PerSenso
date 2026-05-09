import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      include: {
        supplier: true,
        restocks: { include: { product: true } },
        fundingEntries: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        restocks: { include: { product: true } },
        fundingEntries: true,
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async create(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          date: new Date(dto.date),
          supplierId: dto.supplierId ?? null,
          shippingCost: dto.shippingCost ?? 0,
          marketingCost: dto.marketingCost ?? 0,
          notes: dto.notes ?? null,
        },
      });

      for (const item of dto.restocks) {
        await tx.restock.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            baseUnitCost: item.baseUnitCost,
          },
        });
      }

      for (const entry of dto.fundingEntries ?? []) {
        await tx.fundingEntry.create({
          data: {
            orderId: order.id,
            investor: entry.investor,
            method: entry.method,
            amount: entry.amount,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { restocks: true, fundingEntries: true, supplier: true },
      });
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
        ...(dto.shippingCost !== undefined && {
          shippingCost: dto.shippingCost,
        }),
        ...(dto.marketingCost !== undefined && {
          marketingCost: dto.marketingCost,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
