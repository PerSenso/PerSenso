/**
 * Script one-shot: vincula imágenes ya subidas en Cloudinary con los productos de PostgreSQL.
 *
 * Estrategia (no sube duplicados):
 *   1. Lista todas las imágenes en persenso/products/ en Cloudinary.
 *   2. Descarga cada imagen y calcula su SHA-256.
 *   3. Para cada producto de Firebase con imagen base64:
 *      a. Decodifica el base64 y calcula su SHA-256.
 *      b. Busca coincidencia en el mapa hash → Cloudinary URL.
 *      c. Si encuentra → actualiza imageUrl en Postgres (sin re-subir).
 *      d. Si no encuentra → sube como imagen nueva (producto genuinamente nuevo).
 *   4. Salta productos que ya tienen imageUrl en Postgres.
 *
 * Uso: npx ts-node scripts/link-cloudinary-images.ts  (desde apps/api/)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const EXPORT_PATH = path.join(path.dirname(__filename), 'firebase-export.json');
const CLOUDINARY_FOLDER = 'persenso/products';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function base64ToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function listCloudinaryImages(): Promise<{ public_id: string; secure_url: string }[]> {
  const resources: { public_id: string; secure_url: string }[] = [];
  let nextCursor: string | undefined;

  do {
    const result: any = await cloudinary.api.resources({
      type: 'upload',
      prefix: CLOUDINARY_FOLDER + '/',
      max_results: 500,
      next_cursor: nextCursor,
    });
    resources.push(...result.resources);
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
}

async function main() {
  console.log('🔗 Vinculando imágenes Cloudinary → PostgreSQL (sin duplicados)\n');

  // ── 1. Cargar export Firebase ──────────────────────────────────────────────
  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const fbInventory: Record<string, any> = raw.inventory ?? {};
  const fbWithImage = Object.entries(fbInventory).filter(
    ([, v]) => v.image && String(v.image).startsWith('data:'),
  );
  console.log(`Firebase: ${fbWithImage.length} productos con imagen base64`);

  // ── 2. Listar imágenes en Cloudinary y construir hash → url ───────────────
  console.log(`\nDescargando imágenes de Cloudinary para calcular hashes...`);
  const cloudinaryImages = await listCloudinaryImages();
  console.log(`Cloudinary: ${cloudinaryImages.length} imágenes en ${CLOUDINARY_FOLDER}/`);

  const hashToUrl = new Map<string, string>();
  for (let i = 0; i < cloudinaryImages.length; i++) {
    const img = cloudinaryImages[i];
    try {
      const buf = await downloadBuffer(img.secure_url);
      const hash = sha256(buf);
      hashToUrl.set(hash, img.secure_url);
      process.stdout.write(`\r  Hashing Cloudinary: ${i + 1}/${cloudinaryImages.length}`);
    } catch {
      console.error(`\n  ⚠️  No se pudo descargar: ${img.public_id}`);
    }
  }
  console.log(`\n  ${hashToUrl.size} hashes calculados`);

  // ── 3. Procesar productos ──────────────────────────────────────────────────
  let linked = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [fbKey, fb] of fbWithImage) {
    const name: string = fb.name ?? '';

    try {
      // Buscar producto en Postgres
      const product = await prisma.product.findFirst({ where: { name } });
      if (!product) {
        console.log(`\n  ⚠️  Producto no encontrado en BD: "${name}" (${fbKey})`);
        failed++;
        continue;
      }

      // Saltar si ya tiene imageUrl
      if (product.imageUrl) {
        skipped++;
        continue;
      }

      // Calcular hash del base64 de Firebase
      const fbBuf = base64ToBuffer(fb.image);
      const fbHash = sha256(fbBuf);

      const existingUrl = hashToUrl.get(fbHash);

      if (existingUrl) {
        // Imagen ya está en Cloudinary → vincular sin subir
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: existingUrl },
        });
        linked++;
        console.log(`\n  🔗 [${linked + uploaded}] ${name}`);
      } else {
        // Imagen genuinamente nueva → subir a Cloudinary
        const result = await cloudinary.uploader.upload(fb.image, {
          folder: CLOUDINARY_FOLDER,
          resource_type: 'image',
        });
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: result.secure_url },
        });
        uploaded++;
        console.log(`\n  ☁️  [nuevo] ${name}`);
      }
    } catch (e: any) {
      failed++;
      console.error(`\n  ❌ ${name} (${fbKey}): ${e.message}`);
    }
  }

  // ── 4. Reporte ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`🔗 Vinculadas (sin subir):  ${linked}`);
  console.log(`☁️  Subidas nuevas:          ${uploaded}`);
  console.log(`⏭️  Ya tenían imageUrl:       ${skipped}`);
  console.log(`❌ Fallidas:                ${failed}`);

  if (linked + uploaded + skipped === fbWithImage.length) {
    console.log('\n✨ Todos los productos tienen imageUrl asignada');
  }
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
