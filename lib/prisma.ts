import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton
 * 
 * This ensures we don't create multiple instances of PrismaClient in development
 * due to hot reloading, which can exhaust database connections.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

