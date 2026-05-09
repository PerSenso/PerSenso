import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async getUnifiedCash() {
    const [paymentRows, restockCostRows, movements] = await Promise.all([
      this.prisma.$queryRaw<{ method: string; total: string; count: string }[]>`
        SELECT
          "paymentMethod" AS method,
          SUM(amount) AS total,
          COUNT(*) AS count
        FROM "Payment"
        GROUP BY "paymentMethod"
      `,
      this.prisma.$queryRaw<{ total: string }[]>`
        SELECT 
          (SELECT COALESCE(SUM(quantity * "baseUnitCost"), 0) FROM "Restock") +
          (SELECT COALESCE(SUM("shippingCost" + "marketingCost"), 0) FROM "Order") AS total
      `,
      this.prisma.cashMovement.findMany({ orderBy: { date: 'desc' } }),
    ]);

    const paymentsByMethod = paymentRows.map((p) => ({
      method: p.method,
      total: Number(p.total),
      count: Number(p.count),
    }));

    const totalIn = paymentsByMethod.reduce((acc, p) => acc + p.total, 0);
    const restockTotal = Number(restockCostRows[0]?.total ?? 0);
    const manualOut = movements
      .filter((m) => m.type === 'retiro')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const totalOut = restockTotal + manualOut;

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      paymentsByMethod,
      movements,
    };
  }

  createMovement(dto: CreateMovementDto) {
    return this.prisma.cashMovement.create({
      data: {
        type: dto.type,
        source: dto.source,
        method: dto.method,
        amount: dto.amount,
        date: new Date(dto.date),
        notes: dto.notes ?? null,
      },
    });
  }

  async removeMovement(id: string) {
    const movement = await this.prisma.cashMovement.findUnique({
      where: { id },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return this.prisma.cashMovement.delete({ where: { id } });
  }
}
