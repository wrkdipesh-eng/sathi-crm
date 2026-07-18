import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString, max: 1 }); // PGlite can't handle concurrent connections
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple instances of Prisma Client in development due to hot reloading
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
    pool?: Pool;
  };
  
  if (!globalWithPrisma.pool) {
    globalWithPrisma.pool = new Pool({ connectionString, max: 1 }); // PGlite can't handle concurrent connections
  }
  
  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaPg(globalWithPrisma.pool);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  
  prisma = globalWithPrisma.prisma;
}

export default prisma;
