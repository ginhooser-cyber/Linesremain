// ─── Database Seed Script ───
// Run with: npm run db:seed (uses tsx)

import { db } from './connection.js';
import { sql } from 'drizzle-orm';
import { closeDatabase } from './connection.js';

async function seed(): Promise<void> {
  console.log('🌱 Running database seed...');

  try {
    // Verify database connectivity
    await db.execute(sql`SELECT 1 AS ok`);
    console.log('✅ Database connection verified.');

    // Verify tables exist by querying information_schema
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = (tables as unknown as { table_name: string }[]).map(
      (r) => r.table_name,
    );

    const expectedTables = [
      'players',
      'player_states',
      'clans',
      'clan_members',
      'world_chunks',
      'buildings',
      'tool_cupboards',
      'refresh_tokens',
    ];

    const missingTables = expectedTables.filter((t) => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.warn(
        `⚠️  Missing tables: ${missingTables.join(', ')}. Run migrations first: npm run db:migrate`,
      );
    } else {
      console.log(`✅ All ${expectedTables.length} expected tables found.`);
    }

    console.log('🌱 Seed complete.');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

seed();