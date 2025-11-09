#!/usr/bin/env node
/**
 * Database Connection Test Utility
 * 
 * This script tests both DATABASE_URL and DIRECT_URL connections
 * Run with: node scripts/test-db-connection.mjs
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env file');
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.warn('⚠️ DIRECT_URL is not defined in .env file');
}

// Test connection using DATABASE_URL (pooled connection)
async function testPooledConnection() {
  console.log('🔍 Testing DATABASE_URL connection (pooled)...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    console.log(`🔌 Connecting to: ${maskConnectionString(process.env.DATABASE_URL)}`);
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ DATABASE_URL connection successful!');
    console.log(`🛢️ PostgreSQL version: ${result[0].version}`);
    return true;
  } catch (error) {
    console.error('❌ DATABASE_URL connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test connection using DIRECT_URL (direct connection)
async function testDirectConnection() {
  if (!process.env.DIRECT_URL) {
    console.log('⏩ Skipping DIRECT_URL test (not defined)');
    return false;
  }
  
  console.log('🔍 Testing DIRECT_URL connection (direct)...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL,
      },
    },
  });
  
  try {
    console.log(`🔌 Connecting to: ${maskConnectionString(process.env.DIRECT_URL)}`);
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ DIRECT_URL connection successful!');
    console.log(`🛢️ PostgreSQL version: ${result[0].version}`);
    return true;
  } catch (error) {
    console.error('❌ DIRECT_URL connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test basic data access
async function testDataAccess() {
  console.log('\n🔍 Testing data access...');
  
  const prisma = new PrismaClient();
  
  try {
    // Count tables
    const studentCount = await prisma.student.count();
    const teacherCount = await prisma.teacher.count();
    const webinarCount = await prisma.webinarRegistration.count();
    
    console.log('✅ Data access successful!');
    console.log('📊 Database statistics:');
    console.log(`   - Students: ${studentCount}`);
    console.log(`   - Teachers: ${teacherCount}`);
    console.log(`   - Webinar Registrations: ${webinarCount}`);
    return true;
  } catch (error) {
    console.error('❌ Data access failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Mask sensitive parts of connection string for logging
function maskConnectionString(url) {
  if (!url) return 'undefined';
  try {
    const parsed = new URL(url);
    
    // Mask username and password
    if (parsed.username) parsed.username = '***';
    if (parsed.password) parsed.password = '***';
    
    // Show only domain part
    return parsed.origin + parsed.pathname;
  } catch (error) {
    return 'Invalid URL format';
  }
}

// Main function to run all tests
async function runTests() {
  console.log('🧪 Database Connection Test Utility');
  console.log('==================================');
  
  // Check for pgBouncer configuration in DATABASE_URL
  if (process.env.DATABASE_URL?.includes('pgbouncer=true')) {
    console.log('ℹ️ DATABASE_URL includes pgBouncer mode');
  }
  
  const pooledResult = await testPooledConnection();
  console.log('');
  const directResult = await testDirectConnection();
  
  if (pooledResult || directResult) {
    console.log('\n🎉 At least one connection method works!');
    await testDataAccess();
  } else {
    console.error('\n❌ All connection attempts failed');
    console.log('\n🛠️ Troubleshooting tips:');
    console.log('1. Check your .env file for correct DATABASE_URL and DIRECT_URL');
    console.log('2. Make sure any @ symbols in passwords are URL encoded as %40');
    console.log('3. For Supabase with pgBouncer, ensure you have:');
    console.log('   - DATABASE_URL with ?pgbouncer=true&connection_limit=1 params');
    console.log('   - DIRECT_URL for schema migrations and introspection');
    console.log('4. Verify that your IP address is allowed in database firewall');
  }
}

// Run the tests
runTests()
  .catch(e => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });