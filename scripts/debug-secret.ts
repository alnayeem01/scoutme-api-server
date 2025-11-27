/**
 * Debug script to inspect AWS Secrets Manager secret structure
 * 
 * This script fetches the secret and shows its structure without exposing sensitive data
 * 
 * Usage:
 *   ts-node scripts/debug-secret.ts
 */

import { getSecretFromAWS } from '../src/utils/awsSecrets';
import dotenv from 'dotenv';

dotenv.config();

async function debugSecret() {
  try {
    const secretName = process.env.AWS_SECRET_NAME || 'rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db';
    const awsRegion = process.env.AWS_REGION || 'eu-west-2';

    console.log('🔍 Fetching secret to inspect structure...\n');
    console.log(`Secret Name: ${secretName}`);
    console.log(`Region: ${awsRegion}\n`);

    const secret = await getSecretFromAWS(secretName, awsRegion);

    console.log('\n📋 Secret Structure (sensitive data masked):');
    console.log('=' .repeat(50));
    
    const safeSecret: any = {};
    for (const [key, value] of Object.entries(secret)) {
      if (key === 'password') {
        safeSecret[key] = '***MASKED***';
      } else if (typeof value === 'string' && value.length > 50) {
        safeSecret[key] = value.substring(0, 50) + '...';
      } else {
        safeSecret[key] = value;
      }
    }
    
    console.log(JSON.stringify(safeSecret, null, 2));
    console.log('\n');

    // Check for required fields
    console.log('✅ Field Validation:');
    console.log(`  username: ${secret.username ? '✅ Present' : '❌ Missing'}`);
    console.log(`  password: ${secret.password ? '✅ Present' : '❌ Missing'}`);
    console.log(`  host: ${secret.host ? '✅ Present' : '❌ Missing'}`);
    console.log(`  address: ${secret.address ? '✅ Present (alternative to host)' : '❌ Missing'}`);
    console.log(`  port: ${secret.port ? '✅ Present' : '❌ Missing'}`);
    console.log(`  dbname: ${secret.dbname ? '✅ Present' : '⚠️  Optional (missing)'}`);
    console.log(`  engine: ${secret.engine ? '✅ Present' : '❌ Missing'}`);

    // Show all available keys
    console.log('\n📌 All available fields in secret:');
    console.log('  ' + Object.keys(secret).join(', '));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

debugSecret();

