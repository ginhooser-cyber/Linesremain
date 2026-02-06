// ─── Animation System ───
// Central system that manages animation updates for all player renderers.
// Handles both the local player and remote player entities.

import { PlayerRenderer } from '../entities/PlayerRenderer';

// ─── Animation System ───

export class AnimationSystem {
  private renderers = new Map<string, PlayerRenderer>();

  // ─── Registration ───

  /**
   * Register a player renderer with a unique entity ID.
   */
  register(entityId: string, renderer: PlayerRenderer): void {
    this.renderers.set(entityId, renderer);
  }

  /**
   * Unregister a player renderer.
   */
  unregister(entityId: string): void {
    this.renderers.delete(entityId);
  }

  /**
   * Get a registered renderer by entity ID.
   */
  getRenderer(entityId: string): PlayerRenderer | undefined {
    return this.renderers.get(entityId);
  }

  // ─── Update ───

  /**
   * Update all registered animations. Call each frame with delta time.
   */
  update(dt: number): void {
    for (const [, renderer] of this.renderers) {
      renderer.update(dt);
    }
  }

  // ─── Queries ───

  getEntityIds(): string[] {
    return Array.from(this.renderers.keys());
  }

  getRendererCount(): number {
    return this.renderers.size;
  }

  // ─── Cleanup ───

  /**
   * Dispose all renderers and clear the system.
   */
  dispose(): void {
    for (const [, renderer] of this.renderers) {
      renderer.dispose();
    }
    this.renderers.clear();
  }

  /**
   * Clear registrations without disposing renderers.
   */
  clear(): void {
    this.renderers.clear();
  }
}