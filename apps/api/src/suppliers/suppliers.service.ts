import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async getBalance(supplierId: string) {
    await this.findOne(supplierId);
    const result = await this.prisma.$queryRaw<
      { total_invested: string; total_costs: string }[]
    >`
      SELECT
        COALESCE(SUM(fe.amount), 0) AS total_invested,
        COALESCE(SUM(o."shippingCost" + o."marketingCost"), 0) AS total_costs
      FROM "Order" o
      LEFT JOIN "FundingEntry" fe ON fe."orderId" = o.id
      WHERE o."supplierId" = ${supplierId}
    `;
    return {
      supplierId,
      totalInvested: Number(result[0]?.total_invested ?? 0),
      totalCosts: Number(result[0]?.total_costs ?? 0),
    };
  }

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.delete({ where: { id } });
  }
}
