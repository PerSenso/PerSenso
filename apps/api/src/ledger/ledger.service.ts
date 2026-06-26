import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { CreateExchangeDto } from './dto/create-exchange.dto';

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
      this.prisma.cashMovement.findMany({
        orderBy: [{ date: 'desc' }, { exchangeId: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const paymentsByMethod = paymentRows.map((p) => ({
      method: p.method,
      total: Number(p.total),
      count: Number(p.count),
    }));

    const paymentsIn = paymentsByMethod.reduce((acc, p) => acc + p.total, 0);
    const manualIn = movements
      .filter((m) => m.type === 'ingreso')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const totalIn = paymentsIn + manualIn;
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
        owner: dto.owner ?? null,
        paymentMethod: dto.paymentMethod ?? null,
      },
    });
  }

  async updateMovement(id: string, dto: UpdateMovementDto) {
    const existing = await this.prisma.cashMovement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Movimiento no encontrado');
    return this.prisma.cashMovement.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.method !== undefined ? { method: dto.method } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
        ...(dto.paymentMethod !== undefined
          ? { paymentMethod: dto.paymentMethod }
          : {}),
      },
    });
  }

  async getContributions() {
    const rows = await this.prisma.$queryRaw<
      { investor: string; total: string; count: string }[]
    >`
      SELECT
        investor,
        SUM(amount) AS total,
        COUNT(DISTINCT "orderId") AS count
      FROM "FundingEntry"
      GROUP BY investor
      ORDER BY SUM(amount) DESC
    `;
    return rows.map((r) => ({
      investor: r.investor,
      totalContributed: Number(r.total),
      ordersCount: Number(r.count),
    }));
  }

  async createExchange(dto: CreateExchangeDto) {
    const label = `Cambio: ${dto.fromMethod.toUpperCase()} → ${dto.toMethod.toUpperCase()}`;
    const notes = dto.notes ?? label;
    const date = new Date(dto.date);
    const owner = dto.owner ?? null;
    const exchangeId = randomUUID();

    const [retiro, ingreso] = await this.prisma.$transaction([
      this.prisma.cashMovement.create({
        data: { type: 'retiro', source: label, method: dto.fromMethod, amount: dto.amount, date, notes, owner, exchangeId },
      }),
      this.prisma.cashMovement.create({
        data: { type: 'ingreso', source: label, method: dto.toMethod, amount: dto.amount, date, notes, owner, exchangeId },
      }),
    ]);
    return { retiro, ingreso };
  }

  async removeMovement(id: string) {
    const movement = await this.prisma.cashMovement.findUnique({
      where: { id },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return this.prisma.cashMovement.delete({ where: { id } });
  }
}
