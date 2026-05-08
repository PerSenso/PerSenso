import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.sale.findMany({
      include: { client: true, product: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { client: true, product: true, payments: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async getBalance(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { payments: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');

    const total = Number(sale.total);
    const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = Math.max(0, total - paid);
    const status = pending === 0 ? 'paid' : paid === 0 ? 'unpaid' : 'partial';

    return { total, paid, pending, status };
  }

  async create(dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      const restock = await tx.restock.findFirst({
        where: { productId: dto.productId, sales: { none: {} } },
        orderBy: { createdAt: 'asc' },
      });

      const unitCost = restock
        ? Number(restock.baseUnitCost)
        : await this.getProductCost(tx, dto.productId);

      const profit = Number(dto.total) - unitCost;
      const marginPct =
        unitCost > 0
          ? parseFloat(((profit / Number(dto.total)) * 100).toFixed(2))
          : null;

      const sale = await tx.sale.create({
        data: {
          clientId: dto.clientId,
          productId: dto.productId,
          restockSourceId: restock?.id ?? null,
          total: dto.total,
          unitCostAtSale: unitCost,
          profitAtSale: profit,
          marginPctAtSale: marginPct,
          date: new Date(dto.date),
          notes: dto.notes ?? null,
        },
      });

      if (dto.initialPayment) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            clientId: dto.clientId,
            amount: dto.initialPayment.amount,
            paymentMethod: dto.initialPayment.method,
            isInitial: true,
            date: new Date(),
          },
        });
      }

      return sale;
    });
  }

  async update(id: string, dto: UpdateSaleDto) {
    await this.findOne(id);
    return this.prisma.sale.update({
      where: { id },
      data: {
        ...(dto.total !== undefined && { total: dto.total }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sale.delete({ where: { id } });
  }

  private async getProductCost(tx: any, productId: string): Promise<number> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { costPrice: true },
    });
    return product ? Number(product.costPrice) : 0;
  }
}
