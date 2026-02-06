// ─── Clan Repository ───

import { eq, and } from 'drizzle-orm';
import { db } from '../connection.js';
import { clans, clanMembers, players } from '../schema.js';
import type { Clan, ClanMember } from '../schema.js';

export class ClanRepository {
  /**
   * Create a new clan and add the leader as the first member.
   */
  async createClan(name: string, leaderId: string): Promise<Clan> {
    return db.transaction(async (tx) => {
      const [clan] = await tx
        .insert(clans)
        .values({ name, leaderId })
        .returning();

      if (!clan) {
        throw new Error('Failed to create clan');
      }

      await tx.insert(clanMembers).values({
        clanId: clan.id,
        playerId: leaderId,
        role: 'leader',
      });

      return clan;
    });
  }

  /**
   * Find a clan by name.
   */
  async findByName(name: string): Promise<Clan | null> {
    const [clan] = await db
      .select()
      .from(clans)
      .where(eq(clans.name, name))
      .limit(1);

    return clan ?? null;
  }

  /**
   * Find a clan by UUID.
   */
  async findById(id: string): Promise<Clan | null> {
    const [clan] = await db
      .select()
      .from(clans)
      .where(eq(clans.id, id))
      .limit(1);

    return clan ?? null;
  }

  /**
   * Add a member to a clan.
   */
  async addMember(
    clanId: string,
    playerId: string,
    role: string = 'member',
  ): Promise<void> {
    await db.insert(clanMembers).values({ clanId, playerId, role });
  }

  /**
   * Remove a member from a clan.
   */
  async removeMember(clanId: string, playerId: string): Promise<void> {
    await db
      .delete(clanMembers)
      .where(
        and(eq(clanMembers.clanId, clanId), eq(clanMembers.playerId, playerId)),
      );
  }

  /**
   * Get all members of a clan with their player info.
   */
  async getMembers(
    clanId: string,
  ): Promise<(ClanMember & { username: string })[]> {
    const rows = await db
      .select({
        clanId: clanMembers.clanId,
        playerId: clanMembers.playerId,
        role: clanMembers.role,
        joinedAt: clanMembers.joinedAt,
        username: players.username,
      })
      .from(clanMembers)
      .innerJoin(players, eq(clanMembers.playerId, players.id))
      .where(eq(clanMembers.clanId, clanId));

    return rows;
  }

  /**
   * Get the clan a player belongs to (if any).
   */
  async getClanForPlayer(playerId: string): Promise<Clan | null> {
    const [membership] = await db
      .select({ clanId: clanMembers.clanId })
      .from(clanMembers)
      .where(eq(clanMembers.playerId, playerId))
      .limit(1);

    if (!membership) return null;

    return this.findById(membership.clanId);
  }

  /**
   * Delete a clan and all its members (cascade).
   */
  async deleteClan(id: string): Promise<void> {
    await db.delete(clans).where(eq(clans.id, id));
  }
}

export const clanRepository = new ClanRepository();