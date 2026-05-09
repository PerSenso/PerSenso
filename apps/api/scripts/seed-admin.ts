import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash('admin1234', 12);

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hash, role: 'ADMIN' },
  });

  console.log('Admin user ready:', user.id, user.username, user.role);
  await prisma.$disconnect();
}

seed().catch(console.error);
