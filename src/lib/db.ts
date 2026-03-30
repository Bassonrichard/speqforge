import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get or create PrismaClient singleton
 * Uses libSQL adapter for SQLite support in Bun (doesn't support native better-sqlite3)
 * Per Prisma docs: "Bun doesn't support the native SQLite driver that better-sqlite3 relies on"
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

/**
 * Singleton instance of PrismaClient
 * 
 * In development, we use a global variable to prevent instantiating multiple PrismaClient objects.
 * Uses libSQL adapter for JavaScript-based SQLite support.
 */
export const db = globalForPrisma.prisma || createPrismaClient();

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
