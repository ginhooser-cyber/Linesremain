// ─── Player Types ───

import type { ItemStack } from './items.js';

export interface PlayerState {
  position: { x: number; y: number; z: number; rotation: number };
  health: number;
  hunger: number;
  thirst: number;
  temperature: number;
  inventory: (ItemStack | null)[];
  equipment: {
    head: ItemStack | null;
    chest: ItemStack | null;
    legs: ItemStack | null;
    feet: ItemStack | null;
    held: ItemStack | null;
  };
}

export enum HeadAccessory {
  None = 'none',
  Bandana = 'bandana',
  Cap = 'cap',
  Helmet = 'helmet',
  Hood = 'hood',
}

export interface PlayerCustomization {
  bodyColor: string; // hex color e.g. '#a0522d'
  headAccessory: HeadAccessory;
}

export interface PlayerStats {
  totalPlaytime: number; // seconds
  totalKills: number;
  totalDeaths: number;
}