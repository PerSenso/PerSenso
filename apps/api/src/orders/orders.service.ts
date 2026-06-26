import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  findAll(startDate?: string, endDate?: string, supplierId?: string) {
    const where: Record<string, any> = {};
    if (supplierId) where['supplierId'] = supplierId;
    if (startDate || endDate) {
      where['date'] = {};
      if (startDate) where['date'].gte = new Date(startDate);
      if (endDate) where['date'].lte = new Date(endDate);
    }

    return this.prisma.order.findMany({
      where,
      include: {
        supplier: true,
        restocks: { include: { product: true } },
        fundingEntries: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getKpis(startDate?: string, endDate?: string) {
    const where: Record<string, any> = {};
    if (startDate || endDate) {
      where['date'] = {};
      if (startDate) where['date'].gte = new Date(startDate);
      if (endDate) where['date'].lte = new Date(endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        restocks: { select: { quantity: true } },
        fundingEntries: { select: { amount: true } },
      },
    });

    const totalOrders = orders.length;
    const totalUnits = orders.reduce(
      (sum, o) => sum + o.restocks.reduce((s, r) => s + r.quantity, 0),
      0,
    );
    const totalInvested = orders.reduce((sum, o) => {
      const funding = o.fundingEntries.reduce(
        (s, f) => s + Number(f.amount),
        0,
      );
      return sum + Number(o.shippingCost) + Number(o.marketingCost) + funding;
    }, 0);

    return { totalOrders, totalUnits, totalInvested };
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

    return this.prisma.$transaction(async (tx) => {
      if (dto.restocks !== undefined) {
        const existing = await tx.restock.findMany({
          where: { orderId: id },
          include: { _count: { select: { sales: true } } },
        });
        const locked = existing.filter((r) => r._count.sales > 0);
        if (locked.length > 0) {
          throw new BadRequestException(
            'No se pueden editar productos que ya tienen ventas registradas',
          );
        }
        await tx.restock.deleteMany({ where: { orderId: id } });
        for (const item of dto.restocks) {
          await tx.restock.create({
            data: {
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              baseUnitCost: item.baseUnitCost,
            },
          });
        }
      }

      return tx.order.update({
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
        include: {
          restocks: { include: { product: true } },
          fundingEntries: true,
          supplier: true,
        },
      });
    });
  }

  async receiveOrder(id: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: 'RECIBIDO' },
    });
  }

  async unreceiveOrder(id: string) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: 'PENDIENTE' },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
