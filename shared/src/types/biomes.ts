// ─── Biome Types ───

import type { BlockType } from './blocks.js';

export enum BiomeType {
  Scorchlands = 'Scorchlands',
  AshwoodForest = 'AshwoodForest',
  MireHollows = 'MireHollows',
  DrygrassPlains = 'DrygrassPlains',
  Greenhollow = 'Greenhollow',
  Mossreach = 'Mossreach',
  FrostveilPeaks = 'FrostveilPeaks',
  SnowmeltWoods = 'SnowmeltWoods',
  GlacialExpanse = 'GlacialExpanse',
}

export interface ResourceMultipliers {
  wood: number;
  stone: number;
  metal: number;
  sulfur: number;
  hqm: number;
}

export interface BiomeDefinition {
  type: BiomeType;
  name: string;
  baseTemperature: number; // °C
  treeFrequency: number; // 0-1
  resourceMultipliers: ResourceMultipliers;
  surfaceBlock: BlockType;
  subsurfaceBlock: BlockType;
}