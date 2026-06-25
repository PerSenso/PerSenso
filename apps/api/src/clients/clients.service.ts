import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllWithDebt() {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        ci: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        debt: unknown;
        salesCount: unknown;
      }[]
    >`
      SELECT
        c.id,
        c.name,
        c.ci,
        c.phone,
        c.address,
        c.notes,
        c."createdAt",
        c."updatedAt",
        COALESCE(
          (SELECT SUM(s.total) FROM "Sale" s WHERE s."clientId" = c.id AND s.status = 'ACTIVA'), 0
        ) - COALESCE(
          (SELECT SUM(p.amount) FROM "Payment" p
           JOIN "Sale" s2 ON p."saleId" = s2.id
           WHERE s2."clientId" = c.id AND s2.status = 'ACTIVA'), 0
        ) AS debt,
        (SELECT COUNT(*) FROM "Sale" s WHERE s."clientId" = c.id AND s.status = 'ACTIVA') AS "salesCount"
      FROM "Client" c
      ORDER BY c.name ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ci: row.ci ?? undefined,
      phone: row.phone ?? undefined,
      address: row.address ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
      debt: Number(row.debt ?? 0),
      salesCount: Number(row.salesCount ?? 0),
    }));
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async findOneWithSales(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          where: { status: 'ACTIVA' },
          include: {
            product: { select: { id: true, name: true, brand: true } },
            payments: { orderBy: { date: 'asc' } },
          },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const totalSpent = client.sales.reduce(
      (s, sale) => s + Number(sale.total),
      0,
    );
    const totalPaid = client.sales.reduce(
      (s, sale) =>
        s + sale.payments.reduce((ps, p) => ps + Number(p.amount), 0),
      0,
    );

    return { ...client, totalSpent, totalPaid, debt: totalSpent - totalPaid };
  }

  async getDebt(clientId: string) {
    await this.findOne(clientId);
    const result = await this.prisma.$queryRaw<{ debt: string }[]>`
      SELECT
        COALESCE(SUM(s.total), 0) - COALESCE(SUM(p.amount), 0) AS debt
      FROM "Sale" s
      LEFT JOIN "Payment" p ON p."saleId" = s.id
      WHERE s."clientId" = ${clientId} AND s.status = 'ACTIVA'
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
    const [salesCount, paymentsCount] = await Promise.all([
      this.prisma.sale.count({ where: { clientId: id } }),
      this.prisma.payment.count({ where: { clientId: id } }),
    ]);
    if (salesCount > 0 || paymentsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar: el cliente tiene historial de ventas o pagos registrados`,
      );
    }
    return this.prisma.client.delete({ where: { id } });
  }
}
