// ─── Database Connection ───

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config.js';
import * as schema from './schema.js';

// Create the postgres.js connection pool
const queryClient = postgres(config.DATABASE_URL, {
  max: config.DATABASE_POOL_SIZE,
  idle_timeout: 20, // seconds
  connect_timeout: 10, // seconds
});

// Create the Drizzle ORM instance with schema for relational queries
export const db = drizzle(queryClient, { schema });

/**
 * Gracefully close the database connection pool.
 */
export async function closeDatabase(): Promise<void> {
  await queryClient.end();
}