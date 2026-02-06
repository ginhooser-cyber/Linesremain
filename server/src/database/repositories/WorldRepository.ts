// ─── World Repository ───

import { eq, and } from 'drizzle-orm';
import { db } from '../connection.js';
import { worldChunks } from '../schema.js';
import type { WorldChunk } from '../schema.js';

export class WorldRepository {
  /**
   * Save (upsert) a chunk's block data.
   */
  async saveChunk(chunkX: number, chunkZ: number, blockData: Buffer): Promise<void> {
    await db
      .insert(worldChunks)
      .values({ chunkX, chunkZ, blockData, modifiedAt: new Date() })
      .onConflictDoUpdate({
        target: [worldChunks.chunkX, worldChunks.chunkZ],
        set: { blockData, modifiedAt: new Date() },
      });
  }

  /**
   * Load a single chunk's block data.
   */
  async loadChunk(chunkX: number, chunkZ: number): Promise<Buffer | null> {
    const [chunk] = await db
      .select()
      .from(worldChunks)
      .where(and(eq(worldChunks.chunkX, chunkX), eq(worldChunks.chunkZ, chunkZ)))
      .limit(1);

    return chunk?.blockData ?? null;
  }

  /**
   * Load all saved chunks from the database.
   */
  async loadAllChunks(): Promise<WorldChunk[]> {
    return db.select().from(worldChunks);
  }

  /**
   * Delete a chunk from the database.
   */
  async deleteChunk(chunkX: number, chunkZ: number): Promise<void> {
    await db
      .delete(worldChunks)
      .where(and(eq(worldChunks.chunkX, chunkX), eq(worldChunks.chunkZ, chunkZ)));
  }
}

export const worldRepository = new WorldRepository();