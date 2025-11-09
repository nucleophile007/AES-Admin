// db-test-both.js
const { PrismaClient } = require('@prisma/client');

async function testConnection(url, name) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });
  
  try {
    console.log(`Testing ${name} connection...`);
    console.log('URL:', url);
    console.log('Trying to connect...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log(`${name} connection successful!`);
    console.log('Query result:', result);
    
    return true;
  } catch (error) {
    console.error(`${name} connection failed:`);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Test pooled connection
  const poolSuccess = await testConnection(process.env.DATABASE_URL, 'DATABASE_URL (pooled)');
  
  // Test direct connection
  const directSuccess = await testConnection(process.env.DIRECT_URL, 'DIRECT_URL (direct)');
  
  return { poolSuccess, directSuccess };
}

main()
  .then(({ poolSuccess, directSuccess }) => {
    console.log('\nSummary:');
    console.log(`- DATABASE_URL: ${poolSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`- DIRECT_URL: ${directSuccess ? '✅ Success' : '❌ Failed'}`);
    
    process.exit((poolSuccess || directSuccess) ? 0 : 1);
  });