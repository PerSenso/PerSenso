import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  findBySale(saleId: string) {
    return this.prisma.payment.findMany({
      where: { saleId },
      orderBy: { date: 'asc' },
    });
  }

  async findSalesWithDebt() {
    const sales = await this.prisma.sale.findMany({
      where: { status: 'ACTIVA' },
      include: {
        client: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        payments: { orderBy: { date: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });

    return sales
      .map((s) => {
        const total = Number(s.total);
        const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const pending = Math.max(0, total - paid);
        return { ...s, total, paid, pending };
      })
      .filter((s) => s.pending > 0);
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  create(dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        saleId: dto.saleId,
        clientId: dto.clientId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        date: new Date(dto.date),
        notes: dto.notes ?? null,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
      },
    });
  }

  async updateReceiptUrl(id: string, receiptUrl: string) {
    await this.findOne(id);
    return this.prisma.payment.update({ where: { id }, data: { receiptUrl } });
  }

  async deleteReceiptUrl(id: string) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: { receiptUrl: null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }
}
