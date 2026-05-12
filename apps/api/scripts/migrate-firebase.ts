/**
 * Script one-shot de migración: Firebase RTDB → PostgreSQL
 *
 * Estructura real del export Firebase (verificada 2026-05-08):
 *   - inventory  → Product    (no "products")
 *   - clients    → Client
 *   - suppliers  → Supplier
 *   - restocks   → Order + Restock + FundingEntry  (con orderId agrupando)
 *   - sales      → Sale + Payment (initialPayment inline)
 *   - payments   → Payment adicionales (post-venta)
 *   - cashMovements → CashMovement
 *
 * Imágenes base64 en inventory/sales/payments: se omiten en la migración.
 * Las imágenes se suben manualmente a Cloudinary vía el admin panel.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const SCRIPT_DIR = path.dirname(__filename);
const EXPORT_PATH = path.join(SCRIPT_DIR, 'firebase-export.json');

function toDecimal(val: unknown): number {
  const n = parseFloat(String(val ?? '0'));
  return isNaN(n) ? 0 : n;
}

function toDate(val: unknown): Date {
  if (!val) return new Date();
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? new Date() : d;
}

function normalizeGender(val: unknown): 'HOMBRE' | 'MUJER' | 'UNISEX' {
  const g = String(val ?? '').toUpperCase();
  if (g === 'HOMBRE' || g === 'MAN' || g === 'MALE') return 'HOMBRE';
  if (g === 'MUJER' || g === 'WOMAN' || g === 'FEMALE') return 'MUJER';
  return 'UNISEX';
}

async function clearDatabase() {
  console.log('🗑️  Limpiando base de datos...');
  await prisma.payment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.fundingEntry.deleteMany();
  await prisma.restock.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  console.log('✅ Tablas limpias\n');
}

async function main() {
  console.log('🚀 Iniciando migración Firebase → PostgreSQL');
  console.log(`   Export: ${EXPORT_PATH}`);

  await clearDatabase();

  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const report = { created: 0, skipped: 0, errors: [] as string[] };

  // ─── 1. Suppliers ──────────────────────────────────────────────────────────
  const fbSuppliers: Record<string, any> = raw.suppliers ?? {};
  const supplierMap: Record<string, string> = {};

  console.log(`\n📦 Migrando ${Object.keys(fbSuppliers).length} proveedores...`);
  for (const [fbKey, fb] of Object.entries(fbSuppliers)) {
    try {
      const supplier = await prisma.supplier.create({
        data: {
          name: fb.name ?? 'Proveedor sin nombre',
          phone: fb.phone ?? null,
          notes: fb.notes ?? null,
        },
      });
      supplierMap[fbKey] = supplier.id;
      report.created++;
    } catch (e: any) {
      report.errors.push(`Proveedor ${fbKey}: ${e.message}`);
    }
  }

  // ─── 2. Inventory → Product ─────────────────────────────────────────────────
  const fbInventory: Record<string, any> = raw.inventory ?? {};
  const productMap: Record<string, string> = {};

  console.log(`\n🧴 Migrando ${Object.keys(fbInventory).length} productos...`);
  for (const [fbKey, fb] of Object.entries(fbInventory)) {
    try {
      const product = await prisma.product.create({
        data: {
          name: fb.name ?? 'Producto sin nombre',
          brand: fb.brand ?? null,
          size: fb.size ?? null,
          sizeMl: fb.sizeMl ? parseInt(String(fb.sizeMl), 10) : null,
          concentration: fb.concentration ?? null,
          gender: normalizeGender(fb.gender),
          costPrice: toDecimal(fb.costPrice),
          salePrice: toDecimal(fb.salePrice),
          minStock: fb.minStock ? parseInt(String(fb.minStock), 10) : 2,
          notes: fb.notes ?? null,
          isPublished: true,
        },
      });
      productMap[fbKey] = product.id;
      report.created++;
    } catch (e: any) {
      report.errors.push(`Producto ${fbKey} (${fb.name}): ${e.message}`);
    }
  }

  // ─── 3. Clients ─────────────────────────────────────────────────────────────
  const fbClients: Record<string, any> = raw.clients ?? {};
  const clientMap: Record<string, string> = {};

  console.log(`\n👤 Migrando ${Object.keys(fbClients).length} clientes...`);
  for (const [fbKey, fb] of Object.entries(fbClients)) {
    try {
      const client = await prisma.client.create({
        data: {
          name: fb.name ?? 'Cliente sin nombre',
          phone: fb.phone ?? null,
          ci: fb.ci ?? null,
          address: fb.address ?? null,
          notes: fb.notes ? String(fb.notes).trim() || null : null,
          createdAt: toDate(fb.createdAt),
        },
      });
      clientMap[fbKey] = client.id;
      report.created++;
    } catch (e: any) {
      report.errors.push(`Cliente ${fbKey} (${fb.name}): ${e.message}`);
    }
  }

  // ─── 4. Restocks → Order + Restock + FundingEntry ───────────────────────────
  // Firebase restocks tienen orderId que agrupa un pedido.
  // Creamos un Order por cada orderId único, luego Restock + FundingEntries.
  const fbRestocks: Record<string, any> = raw.restocks ?? {};
  const restockMap: Record<string, string> = {}; // fbKey → postgres Restock.id
  const orderByFbId: Record<string, string> = {};  // fbOrderId → postgres Order.id

  console.log(`\n📋 Migrando ${Object.keys(fbRestocks).length} restocks...`);
  for (const [fbKey, fb] of Object.entries(fbRestocks)) {
    try {
      const productId = productMap[fb.inventoryId];
      if (!productId) {
        report.errors.push(`Restock ${fbKey}: inventoryId "${fb.inventoryId}" no encontrado`);
        report.skipped++;
        continue;
      }

      // Obtener o crear la Order agrupadora
      let orderId = orderByFbId[fb.orderId];
      if (!orderId) {
        const supplierId = fb.supplierId ? supplierMap[fb.supplierId] : null;
        const order = await prisma.order.create({
          data: {
            date: toDate(fb.date),
            supplierId: supplierId ?? null,
            shippingCost: toDecimal(fb.shippingCost),
            marketingCost: toDecimal(fb.marketingCost),
            notes: fb.notes ?? null,
          },
        });
        orderId = order.id;
        orderByFbId[fb.orderId] = orderId;
        report.created++;

        // FundingEntries del restock (agrupadas en la Order)
        const entries: any[] = Array.isArray(fb.fundingEntries) ? fb.fundingEntries : [];
        for (const entry of entries) {
          await prisma.fundingEntry.create({
            data: {
              orderId,
              investor: entry.investor ?? 'Desconocido',
              method: entry.method ?? 'efectivo',
              amount: toDecimal(entry.amount),
            },
          });
        }
      }

      // Crear el Restock (baseUnitCost = costPriceWithExtra si existe, sino costPrice)
      const baseUnitCost = toDecimal(fb.costPriceWithExtra ?? fb.costPrice);
      const restock = await prisma.restock.create({
        data: {
          orderId,
          productId,
          quantity: fb.qty ? parseInt(String(fb.qty), 10) : 1,
          baseUnitCost,
          createdAt: toDate(fb.createdAt),
        },
      });
      restockMap[fbKey] = restock.id;
      report.created++;
    } catch (e: any) {
      report.errors.push(`Restock ${fbKey}: ${e.message}`);
    }
  }

  // ─── 5. Sales ───────────────────────────────────────────────────────────────
  const fbSales: Record<string, any> = raw.sales ?? {};
  const saleMap: Record<string, string> = {};
  const unknownClientId = await getOrCreateUnknownClient();

  console.log(`\n💰 Migrando ${Object.keys(fbSales).length} ventas...`);
  for (const [fbKey, fb] of Object.entries(fbSales)) {
    try {
      const productId = productMap[fb.inventoryId];
      if (!productId) {
        report.errors.push(`Venta ${fbKey}: inventoryId "${fb.inventoryId}" no encontrado (perfume: "${fb.perfume}")`);
        report.skipped++;
        continue;
      }

      const clientId = fb.clientId ? (clientMap[fb.clientId] ?? unknownClientId) : unknownClientId;
      const restockSourceId = fb.restockIdSource ? (restockMap[fb.restockIdSource] ?? null) : null;

      const total = toDecimal(fb.total ?? fb.salePriceAtSale);
      const unitCostAtSale = toDecimal(fb.unitCostAtSale);
      const profitAtSale = toDecimal(fb.profitAtSale);
      const marginPctAtSale = fb.marginPctAtSale != null ? toDecimal(fb.marginPctAtSale) : null;

      const sale = await prisma.sale.create({
        data: {
          clientId,
          productId,
          restockSourceId,
          total,
          unitCostAtSale,
          profitAtSale,
          marginPctAtSale,
          date: toDate(fb.date),
          notes: fb.notes ?? null,
          createdAt: toDate(fb.createdAt),
        },
      });
      saleMap[fbKey] = sale.id;
      report.created++;

      // Pago inicial inline en la venta
      if (fb.initialPayment && toDecimal(fb.initialPayment) > 0) {
        await prisma.payment.create({
          data: {
            saleId: sale.id,
            clientId,
            amount: toDecimal(fb.initialPayment),
            paymentMethod: fb.initialPaymentMethod ?? 'efectivo',
            isInitial: true,
            date: toDate(fb.date),
          },
        });
        report.created++;
      }
    } catch (e: any) {
      report.errors.push(`Venta ${fbKey}: ${e.message}`);
    }
  }

  // ─── 6. Payments adicionales ────────────────────────────────────────────────
  const fbPayments: Record<string, any> = raw.payments ?? {};

  console.log(`\n💳 Migrando ${Object.keys(fbPayments).length} pagos adicionales...`);
  for (const [fbKey, fb] of Object.entries(fbPayments)) {
    try {
      // Saltar pagos iniciales (ya migrados con la venta)
      if (fb.isInitial === true) {
        report.skipped++;
        continue;
      }

      const saleId = saleMap[fb.saleId];
      if (!saleId) {
        report.errors.push(`Pago ${fbKey}: saleId "${fb.saleId}" no encontrado`);
        report.skipped++;
        continue;
      }

      const clientId = fb.clientId ? (clientMap[fb.clientId] ?? unknownClientId) : unknownClientId;

      await prisma.payment.create({
        data: {
          saleId,
          clientId,
          amount: toDecimal(fb.amount),
          paymentMethod: fb.paymentMethod ?? 'efectivo',
          isInitial: false,
          date: toDate(fb.date),
          notes: fb.notes ?? null,
          createdAt: toDate(fb.createdAt),
        },
      });
      report.created++;
    } catch (e: any) {
      report.errors.push(`Pago ${fbKey}: ${e.message}`);
    }
  }

  // ─── 7. CashMovements ───────────────────────────────────────────────────────
  const fbCash: Record<string, any> = raw.cashMovements ?? {};

  console.log(`\n💵 Migrando ${Object.keys(fbCash).length} movimientos de caja...`);
  for (const [fbKey, fb] of Object.entries(fbCash)) {
    try {
      await prisma.cashMovement.create({
        data: {
          type: fb.type ?? 'ingreso',
          source: fb.source ?? 'Desconocido',
          method: fb.method ?? 'efectivo',
          amount: toDecimal(fb.amount),
          date: toDate(fb.date),
          notes: fb.notes ? String(fb.notes).trim() || null : null,
          createdAt: toDate(fb.createdAt),
        },
      });
      report.created++;
    } catch (e: any) {
      report.errors.push(`CashMovement ${fbKey}: ${e.message}`);
    }
  }

  // ─── Reporte final ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Migración completada: ${report.created} registros creados`);
  if (report.skipped > 0) {
    console.log(`⏭️  ${report.skipped} registros omitidos (duplicados o referencias faltantes)`);
  }
  if (report.errors.length > 0) {
    console.error(`❌ ${report.errors.length} errores:`);
    report.errors.forEach((e) => console.error(`  - ${e}`));
    const errPath = path.join(SCRIPT_DIR, 'migration-errors.json');
    fs.writeFileSync(errPath, JSON.stringify(report.errors, null, 2));
    console.log(`   Errores guardados en: ${errPath}`);
  } else {
    console.log('✨ Sin errores de migración');
  }
}

async function getOrCreateUnknownClient(): Promise<string> {
  const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';
  const existing = await prisma.client.findUnique({ where: { id: UNKNOWN_ID } });
  if (existing) return existing.id;

  const client = await prisma.client.create({
    data: {
      id: UNKNOWN_ID,
      name: 'Cliente desconocido (migración)',
    },
  });
  return client.id;
}

main()
  .catch((e) => {
    console.error('💥 Error fatal en migración:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
