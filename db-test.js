// db-test.js
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Trying to connect...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Connection successful!');
    console.log('Query result:', result);
    
    return true;
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('Database connection test passed!');
    } else {
      console.log('Database connection test failed!');
    }
    process.exit(success ? 0 : 1);
  });