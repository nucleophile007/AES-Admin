import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Ensure we use the correct database URL format
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
}

// Verify the URL format
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.warn('Warning: DATABASE_URL should start with postgres:// or postgresql://')
}

export const prisma = globalThis.prisma || new PrismaClient({
  datasourceUrl: databaseUrl,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}