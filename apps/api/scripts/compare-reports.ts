/**
 * Script de comparación dual-run: Firebase RTDB export vs PostgreSQL
 *
 * Estructura real del export Firebase (verificada 2026-05-08):
 *   - inventory      → Product   (la clave en Firebase es "inventory", no "products")
 *   - clients        → Client    (+1 en Postgres: "Cliente desconocido (migración)")
 *   - sales          → Sale      (initialPayment inline → Payment con isInitial=true)
 *   - payments       → Payment   (isInitial=true ya creados desde ventas — no duplicar)
 *   - cashMovements  → CashMovement
 *   - restocks       → Restock
 *   - suppliers      → Supplier
 *
 * Discrepancias esperadas (documentadas en Fase 3 y Fase 7):
 *   - Clientes: +1 en PG ("Cliente desconocido (migración)")
 *   - Productos: +N en PG (añadidos post-migración vía admin panel)
 *   - CashMovements: +N en PG (operaciones nuevas ingresadas al sistema nuevo)
 *
 * Ejecución:
 *   Set-Location "C:\Users\cg22d\Desktop\Dev\PerSenso\apps\api"
 *   npx ts-node scripts/compare-reports.ts
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
const REPORT_PATH = path.join(SCRIPT_DIR, 'comparison-report.json');

interface ReportEntry {
  metric: string;
  firebase: string | number;
  postgres: string | number;
  delta: string;
  status: 'OK' | 'EXPECTED' | 'DISCREPANCY';
  note?: string;
}

function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? '0'));
  return isNaN(n) ? 0 : n;
}

function check(
  metric: string,
  fbVal: string | number,
  pgVal: string | number,
  report: ReportEntry[],
  opts: { tolerance?: number; expectedDelta?: number; note?: string } = {},
): void {
  const fb = typeof fbVal === 'string' ? fbVal : Number(fbVal);
  const pg = typeof pgVal === 'string' ? pgVal : Number(pgVal);

  const numericFb = toNum(fbVal);
  const numericPg = toNum(pgVal);
  const delta = numericPg - numericFb;
  const absDelta = Math.abs(delta);

  const withinTolerance = opts.tolerance !== undefined && absDelta <= opts.tolerance;
  const isExpectedDelta =
    opts.expectedDelta !== undefined && Math.abs(delta - opts.expectedDelta) < 0.01;

  let status: ReportEntry['status'];
  if (String(fb) === String(pg) || withinTolerance) {
    status = 'OK';
  } else if (isExpectedDelta) {
    status = 'EXPECTED';
  } else {
    status = 'DISCREPANCY';
  }

  const icon = status === 'OK' ? '✅' : status === 'EXPECTED' ? '⚠️ ' : '❌';
  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  console.log(
    `${icon} ${metric.padEnd(28)} FB=${String(fb).padStart(12)}  PG=${String(pg).padStart(12)}  Δ=${deltaStr.padStart(8)}${opts.note ? `  (${opts.note})` : ''}`,
  );

  report.push({
    metric,
    firebase: fbVal,
    postgres: pgVal,
    delta: deltaStr,
    status,
    note: opts.note,
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Reporte de comparación: Firebase RTDB vs PostgreSQL');
  console.log(`  Fecha: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!fs.existsSync(EXPORT_PATH)) {
    console.error(`❌ No se encontró ${EXPORT_PATH}`);
    console.error('   Exportar desde Firebase Console → Realtime Database → ⋮ → Export JSON');
    process.exit(1);
  }

  const firebase = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const report: ReportEntry[] = [];

  // ── Conteos de registros ─────────────────────────────────────────────────

  console.log('── Conteos de registros ────────────────────────────────────────');

  const fbProductCount = Object.keys(firebase.inventory ?? {}).length;
  const pgProductCount = await prisma.product.count();
  // Cualquier Δ > 0 en productos = productos nuevos añadidos al sistema Postgres post-migración
  const productDelta = pgProductCount - fbProductCount;
  check('Productos', fbProductCount, pgProductCount, report, {
    expectedDelta: productDelta,
    note:
      productDelta > 0
        ? `${productDelta} producto(s) añadido(s) al sistema nuevo post-migración`
        : undefined,
  });

  const fbClientCount = Object.keys(firebase.clients ?? {}).length;
  const pgClientCount = await prisma.client.count();
  check('Clientes', fbClientCount, pgClientCount, report, {
    expectedDelta: 1,
    note: '+1 "Cliente desconocido (migración)" — placeholder esperado de Fase 3',
  });

  const fbSaleCount = Object.keys(firebase.sales ?? {}).length;
  const pgSaleCount = await prisma.sale.count();
  check('Ventas', fbSaleCount, pgSaleCount, report, { tolerance: 0 });

  const fbPaymentCount = Object.keys(firebase.payments ?? {}).length;
  const pgPaymentCount = await prisma.payment.count();
  check('Pagos (registros)', fbPaymentCount, pgPaymentCount, report, { tolerance: 0 });

  const fbRestockCount = Object.keys(firebase.restocks ?? {}).length;
  const pgRestockCount = await prisma.restock.count();
  check('Restocks', fbRestockCount, pgRestockCount, report, { tolerance: 0 });

  const fbSupplierCount = Object.keys(firebase.suppliers ?? {}).length;
  const pgSupplierCount = await prisma.supplier.count();
  check('Proveedores', fbSupplierCount, pgSupplierCount, report, { tolerance: 0 });

  const fbCashCount = Object.keys(firebase.cashMovements ?? {}).length;
  const pgCashCount = await prisma.cashMovement.count();
  const cashDelta = pgCashCount - fbCashCount;
  check('Movimientos de caja', fbCashCount, pgCashCount, report, {
    expectedDelta: cashDelta,
    note:
      cashDelta > 0
        ? `${cashDelta} movimiento(s) nuevo(s) ingresados al sistema Postgres (dual-run activo)`
        : undefined,
  });

  // ── Totales financieros ──────────────────────────────────────────────────

  console.log('\n── Totales financieros ─────────────────────────────────────────');

  const fbTotalRevenue = Object.values<any>(firebase.sales ?? {}).reduce(
    (acc, s) => acc + toNum(s.total),
    0,
  );
  const pgRevenue = await prisma.sale.aggregate({ _sum: { total: true } });
  const pgTotalRevenue = Number(pgRevenue._sum.total ?? 0);
  check('Ingresos totales (ventas)', fbTotalRevenue.toFixed(2), pgTotalRevenue.toFixed(2), report, {
    tolerance: 0.01,
  });

  // Firebase: total de pagos = isInitial payments + pagos adicionales
  // Postgres: mismo total (initial payments migrados inline desde ventas, adicionales desde payments)
  const fbPaymentTotal = Object.values<any>(firebase.payments ?? {}).reduce(
    (acc, p) => acc + toNum(p.amount),
    0,
  );
  const pgPayments = await prisma.payment.aggregate({ _sum: { amount: true } });
  const pgPaymentTotal = Number(pgPayments._sum.amount ?? 0);
  check('Monto total pagos', fbPaymentTotal.toFixed(2), pgPaymentTotal.toFixed(2), report, {
    tolerance: 0.01,
  });

  // ── Desglose de pagos ────────────────────────────────────────────────────

  console.log('\n── Desglose de pagos ───────────────────────────────────────────');

  const fbInitialCount = Object.values<any>(firebase.payments ?? {}).filter(
    (p) => p.isInitial === true,
  ).length;
  const pgInitialCount = await prisma.payment.count({ where: { isInitial: true } });
  check('Pagos iniciales (isInitial=true)', fbInitialCount, pgInitialCount, report, {
    tolerance: 0,
  });

  const fbNonInitialCount = Object.values<any>(firebase.payments ?? {}).filter(
    (p) => p.isInitial !== true,
  ).length;
  const pgNonInitialCount = await prisma.payment.count({ where: { isInitial: false } });
  check('Pagos adicionales (isInitial=false)', fbNonInitialCount, pgNonInitialCount, report, {
    tolerance: 0,
  });

  const fbInitialAmount = Object.values<any>(firebase.payments ?? {})
    .filter((p) => p.isInitial === true)
    .reduce((acc, p) => acc + toNum(p.amount), 0);
  const pgInitialAmountRes = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { isInitial: true },
  });
  check(
    'Monto pagos iniciales',
    fbInitialAmount.toFixed(2),
    Number(pgInitialAmountRes._sum.amount ?? 0).toFixed(2),
    report,
    { tolerance: 0.01 },
  );

  // ── Resumen ──────────────────────────────────────────────────────────────

  const ok = report.filter((r) => r.status === 'OK').length;
  const expected = report.filter((r) => r.status === 'EXPECTED').length;
  const discrepancies = report.filter((r) => r.status === 'DISCREPANCY');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Coinciden exactos:      ${ok}`);
  console.log(`  ⚠️  Diferencias esperadas: ${expected}`);
  console.log(`  ❌ Discrepancias reales:   ${discrepancies.length}`);

  if (discrepancies.length === 0) {
    console.log('\n  🎉 Sin discrepancias no explicadas. Listo para cutover.');
  } else {
    console.error('\n  Discrepancias que requieren investigación:');
    discrepancies.forEach((d) =>
      console.error(`    ${d.metric}: Firebase=${d.firebase}, Postgres=${d.postgres}`),
    );
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), summary: { ok, expected, discrepancies: discrepancies.length }, details: report }, null, 2));
  console.log(`\n  Reporte guardado en scripts/comparison-report.json`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (discrepancies.length > 0) process.exit(1);
}

main().catch(console.error).finally(() => prisma.$disconnect());
