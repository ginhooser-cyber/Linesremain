// ─── Day/Night Cycle System ───
// Advances worldTime each tick and periodically broadcasts to clients.

import type { GameWorld } from '../World.js';
import { DAY_LENGTH_SECONDS } from '@lineremain/shared';

// ─── State ───

let tickCounter = 0;
let dayCount = 1;

// ─── System ───

export function dayNightSystem(world: GameWorld, dt: number): void {
  // Advance world time
  world.worldTime += dt / DAY_LENGTH_SECONDS;
  if (world.worldTime >= 1) {
    world.worldTime -= 1;
    dayCount++;
  }

  tickCounter++;
}

// ─── Queries ───

export function getWorldTime(world: GameWorld): number {
  return world.worldTime;
}

/**
 * Daytime is roughly 0.2 (sunrise) to 0.8 (sunset).
 */
export function isDaytime(world: GameWorld): boolean {
  return world.worldTime > 0.2 && world.worldTime < 0.8;
}

/**
 * Get the current day number (starts at 1, increments each full day cycle).
 */
export function getDayNumber(_world: GameWorld): number {
  return dayCount;
}

/**
 * Check if the broadcast timer has elapsed (every 100 ticks = 5 seconds).
 */
export function shouldBroadcastTime(): boolean {
  return tickCounter % 100 === 0;
}

export function resetDayNightCounter(): void {
  tickCounter = 0;
}