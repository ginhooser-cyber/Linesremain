// ─── Item Types ───

export enum ItemCategory {
  Resource = 'resource',
  Tool = 'tool',
  WeaponMelee = 'weapon_melee',
  WeaponRanged = 'weapon_ranged',
  Ammo = 'ammo',
  Armor = 'armor',
  Consumable = 'consumable',
  Building = 'building',
  Deployable = 'deployable',
  Component = 'component',
  Misc = 'misc',
}

export enum EquipSlot {
  Head = 'head',
  Chest = 'chest',
  Legs = 'legs',
  Feet = 'feet',
  Held = 'held',
}

export interface ItemDefinition {
  id: number;
  name: string;
  category: ItemCategory;
  maxStack: number;
  description: string;
  durability?: number;
  damage?: number;
  armorReduction?: number;
  healAmount?: number;
  hungerRestore?: number;
  thirstRestore?: number;
  gatherMultiplier?: number;
  toolType?: string; // matches block toolRequired: 'axe', 'pickaxe', 'shovel'
  equipSlot?: EquipSlot;
}

export interface ItemStack {
  itemId: number;
  quantity: number;
  durability?: number;
}