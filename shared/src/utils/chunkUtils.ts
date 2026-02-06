// ─── Chunk Utilities ───

import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from '../constants/game.js';

/**
 * Convert world X/Z coordinates to chunk coordinates.
 */
export function worldToChunk(x: number, z: number): { chunkX: number; chunkZ: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE_X),
    chunkZ: Math.floor(z / CHUNK_SIZE_Z),
  };
}

/**
 * Convert world coordinates to local-within-chunk coordinates.
 */
export function worldToLocal(
  x: number,
  y: number,
  z: number,
): { localX: number; localY: number; localZ: number } {
  // Use modulo that handles negative values correctly
  const localX = ((x % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
  const localY = Math.max(0, Math.min(y, CHUNK_SIZE_Y - 1));
  const localZ = ((z % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

  return {
    localX: Math.floor(localX),
    localY: Math.floor(localY),
    localZ: Math.floor(localZ),
  };
}

/**
 * Convert chunk coordinates to world origin coordinates (corner of the chunk).
 */
export function chunkToWorld(chunkX: number, chunkZ: number): { worldX: number; worldZ: number } {
  return {
    worldX: chunkX * CHUNK_SIZE_X,
    worldZ: chunkZ * CHUNK_SIZE_Z,
  };
}

/**
 * Convert local chunk coordinates to a flat array index.
 * Layout: X + Z * SIZE_X + Y * SIZE_X * SIZE_Z
 */
export function getBlockIndex(localX: number, localY: number, localZ: number): number {
  return localX + localZ * CHUNK_SIZE_X + localY * CHUNK_SIZE_X * CHUNK_SIZE_Z;
}

/**
 * Total number of blocks in a single chunk.
 */
export const BLOCKS_PER_CHUNK = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;