import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Singleton instance of PrismaClient
 * 
 * In development, we use a global variable to prevent instantiating multiple PrismaClient objects.
 * In production, we just use the exported client, but should be careful to avoid
 * creating multiple instances due to hot module reloading.
 */
export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('exit', async () => {
    await db.$disconnect();
  });
}

export default db;
