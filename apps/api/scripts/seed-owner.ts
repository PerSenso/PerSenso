import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const username = process.env.OWNER_USERNAME;
  const password = process.env.OWNER_PASSWORD;
  if (!username || !password) {
    console.error('ERROR: OWNER_USERNAME and OWNER_PASSWORD env vars are required');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { username },
    update: { role: 'OWNER', password: hash },
    create: { username, password: hash, role: 'OWNER' },
  });

  console.log('Owner user ready:', user.id, user.username, user.role);
  await prisma.$disconnect();
}

seed().catch(console.error);
