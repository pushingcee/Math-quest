/**
 * BoardGraph: doubly-linked list of traversable tiles.
 *
 * Built from the existing BoardLayout geometry + BoardSystem tile data.
 * Corner tiles (0, 10, 20, 30) exist in the graph for rendering but are
 * NOT linked into the traversal chain — movement skips them implicitly.
 */

import { TileData } from '@/types/game';
import { TileType } from '@/game/constants/enums';
import { computeBoardLayout, TileLayout } from './BoardLayout';
import { BoardTileNode, PawnSlot, generatePawnSlots } from './BoardTile';

export class BoardGraph {
  /** Every tile including corners, keyed by id */
  private tilesById: Map<string, BoardTileNode> = new Map();
  /** Fast lookup by original index */
  private tilesByIndex: Map<number, BoardTileNode> = new Map();
  /** First traversable tile in the chain */
  private head: BoardTileNode | null = null;

  private constructor() {}

  // ── Factory ──────────────────────────────────────────────

  /**
   * Build the graph from a board pixel size and tile data array.
   * This wraps the existing `computeBoardLayout()` so pixel geometry
   * is computed exactly as before.
   */
  static fromLayout(boardPixelSize: number, tileData: TileData[]): BoardGraph {
    const layoutResult = computeBoardLayout(boardPixelSize);
    const graph = new BoardGraph();

    // 1. Create all tile nodes
    for (const layout of layoutResult.tiles) {
      const data = tileData.find(t => t.index === layout.index);
      if (!data) continue;

      const node: BoardTileNode = {
        id: `tile-${layout.index}`,
        index: layout.index,
        tileData: data,
        layout,
        pawnSlots: generatePawnSlots(layout),
        next: null,
        prev: null,
      };

      graph.tilesById.set(node.id, node);
      graph.tilesByIndex.set(node.index, node);
    }

    // 2. Link non-corner tiles in index order
    const traversable = Array.from(graph.tilesByIndex.values())
      .filter((n) => n.tileData.type !== TileType.Corner)
      .sort((a, b) => a.index - b.index);

    for (let i = 0; i < traversable.length; i++) {
      const current = traversable[i];
      const next = traversable[(i + 1) % traversable.length];
      const prev = traversable[(i - 1 + traversable.length) % traversable.length];
      current.next = next;
      current.prev = prev;
    }

    if (traversable.length > 0) {
      graph.head = traversable[0];
    }

    return graph;
  }

  // ── Queries ──────────────────────────────────────────────

  getTileById(id: string): BoardTileNode | null {
    return this.tilesById.get(id) ?? null;
  }

  getTileByIndex(index: number): BoardTileNode | null {
    return this.tilesByIndex.get(index) ?? null;
  }

  /** All tiles including corners (for rendering). */
  getAllTiles(): BoardTileNode[] {
    return Array.from(this.tilesById.values());
  }

  /** Only tiles in the traversal chain (no corners). */
  getTraversableTiles(): BoardTileNode[] {
    if (!this.head) return [];

    const result: BoardTileNode[] = [];
    let current: BoardTileNode | null = this.head;
    do {
      result.push(current);
      current = current.next;
    } while (current && current !== this.head);

    return result;
  }

  /** The first traversable tile (where players start). */
  getHead(): BoardTileNode | null {
    return this.head;
  }

  /**
   * Get the next traversable tile from a given index.
   * If the tile is linked, returns tile.next.
   * If the tile is unlinked (e.g. a corner), returns the head
   * of the traversal chain (first traversable tile).
   */
  getNextFrom(index: number): BoardTileNode | null {
    const tile = this.tilesByIndex.get(index);
    if (!tile) return this.head;

    // Tile is in the chain — follow the link
    if (tile.next) return tile.next;

    // Tile is not linked (corner) — find the nearest traversable tile
    // by scanning forward from this index
    const allIndices = Array.from(this.tilesByIndex.keys()).sort((a, b) => a - b);
    const startIdx = allIndices.indexOf(index);

    for (let i = 1; i <= allIndices.length; i++) {
      const candidate = this.tilesByIndex.get(
        allIndices[(startIdx + i) % allIndices.length]
      );
      if (candidate?.next) return candidate;
    }

    return this.head;
  }

  /**
   * Walk backwards N steps from a given tile index.
   * Returns the destination tile. Stops early at the head if the
   * chain runs out (shouldn't happen in a circular list).
   */
  walkBack(fromIndex: number, steps: number): BoardTileNode | null {
    let current = this.tilesByIndex.get(fromIndex);
    if (!current) return null;

    // If current tile is not linked (corner), find nearest traversable tile backwards
    if (!current.prev) {
      const allIndices = Array.from(this.tilesByIndex.keys()).sort((a, b) => a - b);
      const startIdx = allIndices.indexOf(fromIndex);
      for (let i = 1; i <= allIndices.length; i++) {
        const candidate = this.tilesByIndex.get(
          allIndices[(startIdx - i + allIndices.length) % allIndices.length]
        );
        if (candidate?.prev) {
          current = candidate;
          break;
        }
      }
      if (!current?.prev) return this.head;
    }

    for (let i = 0; i < steps; i++) {
      if (!current!.prev) break;
      current = current!.prev;
    }

    return current;
  }

  // ── Pawn Slot Management ─────────────────────────────────

  /**
   * Claim the first available pawn slot on a tile for a player.
   * Returns the slot, or null if no slots are free.
   */
  claimSlot(tileId: string, playerId: number): PawnSlot | null {
    const tile = this.tilesById.get(tileId);
    if (!tile) return null;

    // If player already has a slot on this tile, return it
    const existing = tile.pawnSlots.find((s) => s.playerId === playerId);
    if (existing) return existing;

    const free = tile.pawnSlots.find((s) => s.playerId === null);
    if (!free) return null;

    free.playerId = playerId;
    return free;
  }

  /**
   * Release a player's pawn slot on a tile.
   */
  releaseSlot(tileId: string, playerId: number): void {
    const tile = this.tilesById.get(tileId);
    if (!tile) return;

    const slot = tile.pawnSlots.find((s) => s.playerId === playerId);
    if (slot) {
      slot.playerId = null;
    }
  }

  /**
   * Get the pawn slot offset for a specific player on a tile.
   * Returns {x: 0, y: 0} if the player has no slot (fallback).
   */
  getPlayerSlotOffset(
    tileIndex: number,
    playerId: number
  ): { x: number; y: number } {
    const tile = this.tilesByIndex.get(tileIndex);
    if (!tile) return { x: 0, y: 0 };

    const slot = tile.pawnSlots.find((s) => s.playerId === playerId);
    if (!slot) return { x: 0, y: 0 };

    return { x: slot.localX, y: slot.localY };
  }

  /**
   * Sync all pawn slots from an array of players.
   * Clears all slots first, then claims for each player's current position.
   */
  syncSlotsFromPlayers(players: { id: number; position: number }[]): void {
    // Clear all slots
    for (const tile of this.tilesById.values()) {
      for (const slot of tile.pawnSlots) {
        slot.playerId = null;
      }
    }

    // Claim slots for each player
    for (const player of players) {
      const tile = this.tilesByIndex.get(player.position);
      if (tile) {
        this.claimSlot(tile.id, player.id);
      }
    }
  }

  // ── Dynamic Board Manipulation ───────────────────────────

  /**
   * Remove a tile from the traversal chain.
   * The tile stays in allTiles for rendering but movement skips it.
   */
  unlinkTile(tileId: string): void {
    const tile = this.tilesById.get(tileId);
    if (!tile || !tile.prev || !tile.next) return;

    // If this is the head, move head forward
    if (tile === this.head) {
      this.head = tile.next !== tile ? tile.next : null;
    }

    // Stitch neighbors together
    tile.prev.next = tile.next;
    tile.next.prev = tile.prev;

    // Disconnect this tile from the chain
    tile.next = null;
    tile.prev = null;
  }

  /**
   * Re-insert a tile into the traversal chain after a given tile.
   */
  relinkTile(tileId: string, afterTileId: string): void {
    const tile = this.tilesById.get(tileId);
    const after = this.tilesById.get(afterTileId);
    if (!tile || !after || !after.next) return;

    // Already linked — unlink first
    if (tile.next || tile.prev) {
      this.unlinkTile(tileId);
    }

    const before = after.next;
    after.next = tile;
    tile.prev = after;
    tile.next = before;
    before.prev = tile;
  }
}
