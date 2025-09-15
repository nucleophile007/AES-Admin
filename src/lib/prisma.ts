import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Force direct database connection and bypass Data Proxy
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
}

// Ensure we're using a direct PostgreSQL connection, not Data Proxy
if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://')) {
  throw new Error('Data Proxy URLs are not supported. Please use a direct PostgreSQL connection string.')
}

// Verify the URL format
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.warn('Warning: DATABASE_URL should start with postgres:// or postgresql://')
}

export const prisma = globalThis.prisma || new PrismaClient({
  // Force direct database connection
  datasourceUrl: databaseUrl,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}