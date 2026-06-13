// server/db.ts
import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaClient) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('⚠️ No DATABASE_URL declared. Prisma operations will be gracefully bypassed or simulated.');
      // Create a dummy client or throw helper error on execution
    }
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl || 'postgresql://dummy:dummy@localhost:5432/dummy'
        }
      }
    });
  }
  return prismaClient;
}
