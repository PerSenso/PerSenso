import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SALE_INCLUDE = {
  client: true,
  product: true,
  payments: true,
  restockSource: {
    include: {
      order: {
        include: {
          supplier: true,
          fundingEntries: true,
        },
      },
    },
  },
} as const;

/**
 * Para resultados de trace por cliente/producto/lote: cada venta listada
 * trae también su lote → pedido → proveedor → financiadores. Esto permite
 * que la vista de cliente muestre, por cada venta, el proveedor y lote que
 * la abasteció — sin requests adicionales.
 */
const SALE_WITH_CHAIN = {
  product: true,
  client: true,
  payments: true,
  restockSource: {
    include: {
      order: {
        include: { supplier: true, fundingEntries: true },
      },
    },
  },
} as const;

@Injectable()
export class TraceService {
  constructor(private prisma: PrismaService) {}

  async resolveId(id: string) {
    // Sale
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: SALE_INCLUDE,
    });
    if (sale) return { type: 'sale' as const, data: sale };

    // Client — every sale brings its product, lote, pedido, proveedor and financiadores
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sales: { include: SALE_WITH_CHAIN, orderBy: { date: 'desc' } },
      },
    });
    if (client) return { type: 'client' as const, data: client };

    // Product — every restock brings its order + supplier; also bring all sales
    // of this product so we can list buyers without an extra request.
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        restocks: {
          include: {
            order: { include: { supplier: true, fundingEntries: true } },
            sales: {
              include: { client: true, payments: true },
              orderBy: { date: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        sales: { include: SALE_WITH_CHAIN, orderBy: { date: 'desc' } },
      },
    });
    if (product) return { type: 'product' as const, data: product };

    // Order — supplier, restocks with product, sales of each restock with client + payments
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        fundingEntries: true,
        restocks: {
          include: {
            product: true,
            sales: {
              include: { client: true, payments: true },
              orderBy: { date: 'desc' },
            },
          },
        },
      },
    });
    if (order) return { type: 'order' as const, data: order };

    // Restock (lote) — product, order + supplier, all sales with client + payments
    const restock = await this.prisma.restock.findUnique({
      where: { id },
      include: {
        product: true,
        order: { include: { supplier: true, fundingEntries: true } },
        sales: {
          include: { client: true, payments: true },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (restock) return { type: 'restock' as const, data: restock };

    throw new NotFoundException(`ID "${id}" no encontrado en ninguna entidad`);
  }
}
