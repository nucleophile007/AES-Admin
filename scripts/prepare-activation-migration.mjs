#!/usr/bin/env node
/**
 * Migration Helper Script
 * This script helps create and apply migrations for the activation fields and tables
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Running migration helper for activation features...');

  try {
    // 1. Check if we can connect to the database
    console.log('🔍 Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Database connection successful');

    // 2. Create the migration files
    console.log('\n📝 Generating migration...');
    try {
      execSync('npx prisma migrate dev --name add_activation_features --create-only', {
        stdio: 'inherit'
      });
      console.log('✅ Migration files created');
    } catch (migrationError) {
      console.error('❌ Failed to create migration:', migrationError);
      process.exit(1);
    }

    // 3. Find the latest migration directory
    const migrationsDir = path.join(process.cwd(), 'prisma/migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(dir => dir.match(/^\d{14}_/))
      .sort()
      .reverse();
    
    if (migrations.length === 0) {
      console.error('❌ No migration directories found');
      process.exit(1);
    }

    const latestMigration = migrations[0];
    const migrationPath = path.join(migrationsDir, latestMigration, 'migration.sql');
    
    console.log(`\n📄 Checking migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration SQL file not found');
      process.exit(1);
    }

    // 4. Read and display the migration SQL
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n📋 Migration SQL:');
    console.log('-----------------');
    console.log(migrationSql);
    console.log('-----------------');

    // 5. Confirm before applying
    console.log('\n⚠️ Please review the migration SQL carefully.');
    console.log('\n🚀 Ready to apply migration. This will:');
    console.log('  - Add isActivated fields to Student and Teacher tables');
    console.log('  - Create ActivationRequest table');
    console.log('\nTo apply the migration, run:');
    console.log('\nnpx prisma migrate dev --name add_activation_features');
    console.log('\nIf you already applied the migration and need to sync the Prisma client, run:');
    console.log('\nnpx prisma generate');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();