// ─── Building Repository ───

import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../connection.js';
import { buildings } from '../schema.js';
import type { Building, NewBuilding } from '../schema.js';

export class BuildingRepository {
  /**
   * Save (upsert) a single building.
   */
  async saveBuilding(building: NewBuilding): Promise<void> {
    await db
      .insert(buildings)
      .values(building)
      .onConflictDoUpdate({
        target: buildings.id,
        set: {
          buildingType: building.buildingType,
          tier: building.tier,
          positionX: building.positionX,
          positionY: building.positionY,
          positionZ: building.positionZ,
          rotation: building.rotation,
          health: building.health,
          lockCode: building.lockCode,
        },
      });
  }

  /**
   * Batch upsert multiple buildings in a single transaction.
   */
  async saveBuildingBatch(buildingList: NewBuilding[]): Promise<void> {
    if (buildingList.length === 0) return;

    await db.transaction(async (tx) => {
      for (const building of buildingList) {
        await tx
          .insert(buildings)
          .values(building)
          .onConflictDoUpdate({
            target: buildings.id,
            set: {
              buildingType: building.buildingType,
              tier: building.tier,
              positionX: building.positionX,
              positionY: building.positionY,
              positionZ: building.positionZ,
              rotation: building.rotation,
              health: building.health,
              lockCode: building.lockCode,
            },
          });
      }
    });
  }

  /**
   * Load all buildings from the database.
   */
  async loadAllBuildings(): Promise<Building[]> {
    return db.select().from(buildings);
  }

  /**
   * Delete a building by ID.
   */
  async deleteBuilding(id: string): Promise<void> {
    await db.delete(buildings).where(eq(buildings.id, id));
  }

  /**
   * Load all buildings within a circular area (approximate square bounding box).
   */
  async loadBuildingsInArea(
    x: number,
    z: number,
    radius: number,
  ): Promise<Building[]> {
    return db
      .select()
      .from(buildings)
      .where(
        and(
          gte(buildings.positionX, x - radius),
          lte(buildings.positionX, x + radius),
          gte(buildings.positionZ, z - radius),
          lte(buildings.positionZ, z + radius),
        ),
      );
  }
}

export const buildingRepository = new BuildingRepository();