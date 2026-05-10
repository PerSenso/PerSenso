import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error('ERROR: ADMIN_USERNAME and ADMIN_PASSWORD env vars are required');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, password: hash, role: 'ADMIN' },
  });

  console.log('Admin user ready:', user.id, user.username, user.role);
  await prisma.$disconnect();
}

seed().catch(console.error);
