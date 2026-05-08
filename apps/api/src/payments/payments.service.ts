import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  findBySale(saleId: string) {
    return this.prisma.payment.findMany({
      where: { saleId },
      orderBy: { date: 'asc' },
    });
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

  async updateReceiptUrl(id: string, receiptUrl: string) {
    await this.findOne(id);
    return this.prisma.payment.update({ where: { id }, data: { receiptUrl } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }
}
