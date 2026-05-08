/**
 * Script one-shot: sube imágenes base64 de Firebase → Cloudinary y actualiza imageUrl en PostgreSQL.
 *
 * Uso: npx ts-node scripts/migrate-images.ts  (desde apps/api/)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const SCRIPT_DIR = path.dirname(__filename);
const EXPORT_PATH = path.join(SCRIPT_DIR, 'firebase-export.json');
const ERRORS_PATH = path.join(SCRIPT_DIR, 'migration-images-errors.json');
const CLOUDINARY_FOLDER = 'persenso/products';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface ErrorEntry {
  fbKey: string;
  name: string;
  reason: string;
}

async function uploadBase64ToCloudinary(dataUri: string): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: CLOUDINARY_FOLDER,
    resource_type: 'image',
  });
  return result.secure_url;
}

async function main() {
  console.log('🖼️  Iniciando migración de imágenes Firebase → Cloudinary');
  console.log(`   Export: ${EXPORT_PATH}`);

  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  const fbInventory: Record<string, any> = raw.inventory ?? {};

  const entries = Object.entries(fbInventory).filter(
    ([, v]) => v.image && String(v.image).startsWith('data:'),
  );

  console.log(`   Productos con imagen base64: ${entries.length}`);

  let uploaded = 0;
  let failed = 0;
  const errors: ErrorEntry[] = [];

  for (const [fbKey, fb] of entries) {
    const name: string = fb.name ?? '(sin nombre)';
    const dataUri: string = fb.image;

    try {
      // 1. Subir a Cloudinary (acepta data URI directamente)
      const imageUrl = await uploadBase64ToCloudinary(dataUri);

      // 2. Buscar el producto en PostgreSQL por nombre exacto
      const product = await prisma.product.findFirst({ where: { name } });
      if (!product) {
        throw new Error(`Producto no encontrado en BD con name="${name}"`);
      }

      // 3. Actualizar imageUrl
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl },
      });

      uploaded++;
      console.log(`   ✅ [${uploaded}/${entries.length}] ${name}`);
    } catch (e: any) {
      failed++;
      const entry: ErrorEntry = { fbKey, name, reason: e.message ?? String(e) };
      errors.push(entry);
      console.error(`   ❌ ${name} (${fbKey}): ${entry.reason}`);
    }
  }

  // ─── Reporte final ──────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Imágenes subidas: ${uploaded}`);
  console.log(`❌ Fallidas:         ${failed}`);

  if (errors.length > 0) {
    fs.writeFileSync(ERRORS_PATH, JSON.stringify(errors, null, 2));
    console.log(`\n   Errores guardados en: ${ERRORS_PATH}`);
  } else {
    console.log('\n✨ Sin errores — todas las imágenes migradas correctamente');
  }
}

main()
  .catch((e) => {
    console.error('💥 Error fatal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
