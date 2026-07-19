import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// Use a single global instance in both dev and prod to prevent connection exhaustion.
// In dev Next.js hot-reloads modules, in prod Apache may spawn multiple workers.
const globalWithPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
  pool?: Pool;
};

if (!globalWithPrisma.pool) {
  globalWithPrisma.pool = new Pool({ connectionString, max: 1 });
}

if (!globalWithPrisma.prisma) {
  const adapter = new PrismaPg(globalWithPrisma.pool);
  globalWithPrisma.prisma = new PrismaClient({ adapter });
}

const prisma = globalWithPrisma.prisma;

export default prisma;

