// ─── Block Registry (Client-Side) ───

import { BlockType } from '@shared/types/blocks';
import { BLOCK_REGISTRY } from '@shared/constants/blocks';

/** UV coordinates for a single face in the texture atlas */
export interface FaceUV {
  u: number; // left edge in 0–1
  v: number; // top edge in 0–1
  w: number; // width in 0–1
  h: number; // height in 0–1
}

/** Per-face texture mapping */
export interface BlockFaces {
  top: FaceUV;
  bottom: FaceUV;
  north: FaceUV;
  south: FaceUV;
  east: FaceUV;
  west: FaceUV;
}

/** Extended client-side block definition */
export interface ClientBlockDef {
  id: BlockType;
  name: string;
  isTransparent: boolean;
  isSolid: boolean;
  faces: BlockFaces;
}

// Atlas layout: 8×8 grid of 32×32 cells in a 256×256 image
const ATLAS_CELLS = 8;
const CELL_UV = 1 / ATLAS_CELLS; // 0.125

function uvFromGrid(gx: number, gy: number): FaceUV {
  return {
    u: gx * CELL_UV,
    v: gy * CELL_UV,
    w: CELL_UV,
    h: CELL_UV,
  };
}

function allFaces(gx: number, gy: number): BlockFaces {
  const uv = uvFromGrid(gx, gy);
  return { top: uv, bottom: uv, north: uv, south: uv, east: uv, west: uv };
}

// ─── Special texture atlas slots ───
// Row 0: Dirt(1,0) GrassTop(2,0) Stone(3,0) Sand(4,0) Snow(5,0) LogBark(6,0) Leaves(7,0)
// Row 1: Planks(0,1) Cobble(1,1) MetalOre(2,1) SulfurOre(3,1) HQMOre(4,1) Bedrock(5,1) Water(6,1) Gravel(7,1)
// Row 2: Clay(0,2) Cactus(1,2) DeadBush(2,2) TallGrass(3,2) Mushroom(4,2) Ice(5,2) MossyStone(6,2) GrassSide(7,2)
// Row 3: LogRing(0,3)

// Pre-computed face UVs for special blocks
const GRASS_FACES: BlockFaces = {
  top: uvFromGrid(2, 0),    // GrassTop
  bottom: uvFromGrid(1, 0), // Dirt
  north: uvFromGrid(7, 2),  // GrassSide
  south: uvFromGrid(7, 2),
  east: uvFromGrid(7, 2),
  west: uvFromGrid(7, 2),
};

const LOG_FACES: BlockFaces = {
  top: uvFromGrid(0, 3),    // LogRing
  bottom: uvFromGrid(0, 3), // LogRing
  north: uvFromGrid(6, 0),  // LogBark
  south: uvFromGrid(6, 0),
  east: uvFromGrid(6, 0),
  west: uvFromGrid(6, 0),
};

// ─── Registry ───

const clientBlocks = new Map<number, ClientBlockDef>();

// Non-solid transparent block types (decorative / passthrough)
const NON_SOLID_BLOCKS = new Set<BlockType>([
  BlockType.Air,
  BlockType.Water,
  BlockType.TallGrass,
  BlockType.DeadBush,
  BlockType.Mushroom,
]);

function registerBlock(id: BlockType, faces: BlockFaces): void {
  const shared = BLOCK_REGISTRY[id];
  if (!shared) return;

  clientBlocks.set(id, {
    id,
    name: shared.name,
    isTransparent: shared.transparent,
    isSolid: !NON_SOLID_BLOCKS.has(id),
    faces,
  });
}

// ── Register all blocks ──

registerBlock(BlockType.Air, allFaces(0, 0));
registerBlock(BlockType.Dirt, allFaces(1, 0));
registerBlock(BlockType.Grass, GRASS_FACES);
registerBlock(BlockType.Stone, allFaces(3, 0));
registerBlock(BlockType.Sand, allFaces(4, 0));
registerBlock(BlockType.Snow, allFaces(5, 0));
registerBlock(BlockType.Log, LOG_FACES);
registerBlock(BlockType.Leaves, allFaces(7, 0));
registerBlock(BlockType.Planks, allFaces(0, 1));
registerBlock(BlockType.Cobblestone, allFaces(1, 1));
registerBlock(BlockType.MetalOre, allFaces(2, 1));
registerBlock(BlockType.SulfurOre, allFaces(3, 1));
registerBlock(BlockType.HQMOre, allFaces(4, 1));
registerBlock(BlockType.Bedrock, allFaces(5, 1));
registerBlock(BlockType.Water, allFaces(6, 1));
registerBlock(BlockType.Gravel, allFaces(7, 1));
registerBlock(BlockType.Clay, allFaces(0, 2));
registerBlock(BlockType.Cactus, allFaces(1, 2));
registerBlock(BlockType.DeadBush, allFaces(2, 2));
registerBlock(BlockType.TallGrass, allFaces(3, 2));
registerBlock(BlockType.Mushroom, allFaces(4, 2));
registerBlock(BlockType.Ice, allFaces(5, 2));
registerBlock(BlockType.MossyStone, allFaces(6, 2));

// ─── Public API ───

const AIR_DEF: ClientBlockDef = {
  id: BlockType.Air,
  name: 'Air',
  isTransparent: true,
  isSolid: false,
  faces: allFaces(0, 0),
};

export function getBlockDef(blockId: number): ClientBlockDef {
  return clientBlocks.get(blockId) ?? AIR_DEF;
}

export function isOpaque(blockId: number): boolean {
  const def = clientBlocks.get(blockId);
  if (!def) return false;
  return !def.isTransparent;
}

export function isSolid(blockId: number): boolean {
  const def = clientBlocks.get(blockId);
  if (!def) return false;
  return def.isSolid;
}