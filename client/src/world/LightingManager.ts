// ─── Lighting Manager ───

import * as THREE from 'three';
import { SkyRenderer } from './SkyRenderer';

// ─── Types ───

interface PointLightEntry {
  id: number;
  light: THREE.PointLight;
  position: THREE.Vector3;
}

// ─── LightingManager Class ───

export class LightingManager {
  private scene: THREE.Scene;
  private skyRenderer: SkyRenderer;

  private pointLights = new Map<number, PointLightEntry>();
  private nextLightId = 1;
  private readonly maxPointLights = 20;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skyRenderer = new SkyRenderer(scene);
  }

  // ─── Update ───

  update(worldTime: number, camera?: THREE.Camera): void {
    this.skyRenderer.update(worldTime);
    if (camera) {
      this.skyRenderer.followCamera(camera);
    }
  }

  // ─── Point Lights ───

  addPointLight(
    position: { x: number; y: number; z: number },
    color: string,
    intensity: number,
    distance: number,
  ): number {
    // If at max capacity, remove the furthest light
    if (this.pointLights.size >= this.maxPointLights) {
      this.removeOldestLight();
    }

    const id = this.nextLightId++;
    const light = new THREE.PointLight(new THREE.Color(color), intensity, distance);
    light.position.set(position.x, position.y, position.z);
    light.castShadow = false; // Point light shadows are expensive

    this.scene.add(light);

    this.pointLights.set(id, {
      id,
      light,
      position: new THREE.Vector3(position.x, position.y, position.z),
    });

    return id;
  }

  removePointLight(id: number): void {
    const entry = this.pointLights.get(id);
    if (entry) {
      this.scene.remove(entry.light);
      entry.light.dispose();
      this.pointLights.delete(id);
    }
  }

  updatePointLightPosition(id: number, position: { x: number; y: number; z: number }): void {
    const entry = this.pointLights.get(id);
    if (entry) {
      entry.light.position.set(position.x, position.y, position.z);
      entry.position.set(position.x, position.y, position.z);
    }
  }

  /** Remove the oldest point light when at capacity */
  private removeOldestLight(): void {
    const first = this.pointLights.keys().next();
    if (!first.done) {
      this.removePointLight(first.value);
    }
  }

  /**
   * Recycle furthest point lights from the player position.
   * Call periodically to keep only the closest lights active.
   */
  recycleDistantLights(playerX: number, playerY: number, playerZ: number): void {
    if (this.pointLights.size <= this.maxPointLights) return;

    // Sort by distance (furthest first)
    const entries = [...this.pointLights.values()].sort((a, b) => {
      const distA =
        (a.position.x - playerX) ** 2 +
        (a.position.y - playerY) ** 2 +
        (a.position.z - playerZ) ** 2;
      const distB =
        (b.position.x - playerX) ** 2 +
        (b.position.y - playerY) ** 2 +
        (b.position.z - playerZ) ** 2;
      return distB - distA;
    });

    // Remove excess lights (furthest first)
    const toRemove = this.pointLights.size - this.maxPointLights;
    for (let i = 0; i < toRemove; i++) {
      this.removePointLight(entries[i]!.id);
    }
  }

  // ─── Accessors ───

  getSkyRenderer(): SkyRenderer {
    return this.skyRenderer;
  }

  getSunLight(): THREE.DirectionalLight {
    return this.skyRenderer.getSunLight();
  }

  getMoonLight(): THREE.DirectionalLight {
    return this.skyRenderer.getMoonLight();
  }

  getAmbientLight(): THREE.AmbientLight {
    return this.skyRenderer.getAmbientLight();
  }

  getPointLightCount(): number {
    return this.pointLights.size;
  }

  // ─── Cleanup ───

  dispose(): void {
    for (const [, entry] of this.pointLights) {
      this.scene.remove(entry.light);
      entry.light.dispose();
    }
    this.pointLights.clear();
    this.skyRenderer.dispose();
  }
}