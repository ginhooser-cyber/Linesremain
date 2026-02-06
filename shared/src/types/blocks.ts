// ─── Block Types ───

export enum BlockType {
  Air = 0,
  Dirt = 1,
  Grass = 2,
  Stone = 3,
  Sand = 4,
  Snow = 5,
  Log = 6,
  Leaves = 7,
  Planks = 8,
  Cobblestone = 9,
  MetalOre = 10,
  SulfurOre = 11,
  HQMOre = 12,
  Bedrock = 13,
  Water = 14,
  Gravel = 15,
  Clay = 16,
  Cactus = 17,
  DeadBush = 18,
  TallGrass = 19,
  Mushroom = 20,
  Ice = 21,
  MossyStone = 22,
}

export interface BlockDefinition {
  id: BlockType;
  name: string;
  hardness: number; // time in seconds to break with bare hands; -1 = unbreakable
  toolRequired?: string; // e.g. 'pickaxe', 'axe', 'shovel'
  dropItemId?: number;
  dropQuantity?: number;
  transparent: boolean;
  textureAtlasPosition: { x: number; y: number };
}