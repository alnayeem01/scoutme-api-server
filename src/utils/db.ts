import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';
import { getDatabaseUrl } from './awsSecrets';

let prismaInstance: PrismaClient | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initializes the database connection using AWS Secrets Manager or DATABASE_URL
 * This should be called once at application startup
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized && prismaInstance) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Get connection string from AWS Secrets Manager or environment variable
      const connectionString = await getDatabaseUrl();

      if (!connectionString) {
        throw new Error('Database connection string is not available');
      }

      // Create connection pool and adapter
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      prismaInstance = new PrismaClient({ adapter });

      // Test the connection
      await prismaInstance.$connect();
      console.log('Database connection established successfully');

      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      isInitialized = false;
      prismaInstance = null;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Gets the Prisma client instance
 * Throws an error if the database hasn't been initialized yet
 */
export function getPrismaClient(): PrismaClient {
  if (!isInitialized || !prismaInstance) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return prismaInstance;
}

// Export prisma for backward compatibility
// This is a getter that will throw if accessed before initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});