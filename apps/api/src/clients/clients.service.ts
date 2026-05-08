import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async getDebt(clientId: string) {
    await this.findOne(clientId);
    const result = await this.prisma.$queryRaw<{ debt: string }[]>`
      SELECT
        COALESCE(SUM(s.total), 0) - COALESCE(SUM(p.amount), 0) AS debt
      FROM "Sale" s
      LEFT JOIN "Payment" p ON p."saleId" = s.id
      WHERE s."clientId" = ${clientId}
    `;
    return { clientId, debt: Number(result[0]?.debt ?? 0) };
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}
