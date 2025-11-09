import { PrismaClient } from '@prisma/client'

// Create a more robust Prisma client with connection handling improvements
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
    // Enable query logging in development only
    ...(process.env.NODE_ENV === 'development' && { log: ['query', 'error', 'warn'] }),
  }).$extends({
    // Add connection handling extensions
    client: {
      async $connect() {
        try {
          // Try to connect with timeout
          const connectPromise = (client as any).$connect();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database connection timeout after 5000ms')), 5000);
          });
          
          await Promise.race([connectPromise, timeoutPromise]);
          console.log('Prisma connection established successfully');
          return connectPromise;
        } catch (error) {
          console.error('Failed to connect to database:', error);
          throw error;
        }
      },
    },
  });
}

// Add prisma to the NodeJS global type
declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const client = globalThis.prisma ?? prismaClientSingleton()
const prisma = client;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = client

export default prisma

// Export a function to test database connectivity
export async function testDatabaseConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}