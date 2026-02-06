// ─── Inventory Utilities ───

import type { ItemStack } from '../types/items.js';

/**
 * Check if two item stacks can be merged (same item, and target has room).
 */
export function canStack(a: ItemStack, b: ItemStack): boolean {
  return a.itemId === b.itemId && a.durability === b.durability;
}

/**
 * Merge source stack into target stack up to maxStack.
 * Returns the updated target and any remaining source (or null if fully merged).
 */
export function mergeStacks(
  target: ItemStack,
  source: ItemStack,
  maxStack: number,
): { target: ItemStack; remaining: ItemStack | null } {
  if (!canStack(target, source)) {
    return { target, remaining: source };
  }

  const spaceAvailable = maxStack - target.quantity;
  const transferAmount = Math.min(spaceAvailable, source.quantity);

  const newTarget: ItemStack = {
    ...target,
    quantity: target.quantity + transferAmount,
  };

  const remainingQuantity = source.quantity - transferAmount;
  const remaining: ItemStack | null =
    remainingQuantity > 0
      ? { ...source, quantity: remainingQuantity }
      : null;

  return { target: newTarget, remaining };
}

/**
 * Split a stack into two halves. The first half gets the ceiling, the second gets the floor.
 * Returns null for the second half if the stack has quantity 1.
 */
export function splitStack(stack: ItemStack): [ItemStack, ItemStack | null] {
  if (stack.quantity <= 1) {
    return [{ ...stack }, null];
  }

  const half1Quantity = Math.ceil(stack.quantity / 2);
  const half2Quantity = Math.floor(stack.quantity / 2);

  const half1: ItemStack = { ...stack, quantity: half1Quantity };
  const half2: ItemStack = { ...stack, quantity: half2Quantity };

  return [half1, half2];
}