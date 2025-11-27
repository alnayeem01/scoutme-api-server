/**
 * Migration script for AWS RDS
 * 
 * This script fetches database credentials from AWS Secrets Manager
 * and runs Prisma migrations on the RDS database.
 * 
 * Usage:
 *   ts-node scripts/migrate-rds.ts
 *   or
 *   npm run migrate:rds
 */

import { execSync } from 'child_process';
import { getDatabaseUrl } from '../src/utils/awsSecrets';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateRDS() {
  try {
    console.log('🚀 Starting RDS migration...\n');

    // Check if we should use AWS Secrets Manager or DATABASE_URL
    const useAwsSecrets = 
      process.env.NODE_ENV === 'production' || 
      !process.env.DATABASE_URL ||
      process.env.FORCE_AWS_SECRETS === 'true';

    let databaseUrl: string;

    if (useAwsSecrets) {
      console.log('📡 Fetching database credentials from AWS Secrets Manager...');
      const secretName = process.env.AWS_SECRET_NAME || 'rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db';
      const awsRegion = process.env.AWS_REGION || 'eu-west-2';
      
      console.log(`   Secret: ${secretName}`);
      console.log(`   Region: ${awsRegion}\n`);

      databaseUrl = await getDatabaseUrl();
      
      // Mask password in logs
      const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
      console.log(`✅ Connection string retrieved: ${maskedUrl}\n`);
    } else {
      databaseUrl = process.env.DATABASE_URL!;
      console.log('📝 Using DATABASE_URL from environment variables\n');
    }

    if (!databaseUrl) {
      throw new Error('Database connection string is not available');
    }

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = databaseUrl;

    console.log('🔄 Running Prisma migrations...\n');

    // Run Prisma migrate deploy (for production) or migrate dev (for development)
    const isProduction = process.env.NODE_ENV === 'production';
    const command = isProduction 
      ? 'npx prisma migrate deploy'
      : 'npx prisma migrate deploy'; // Use deploy for both to apply existing migrations

    try {
      execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
      });
      console.log('\n✅ Migrations completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRDS();

