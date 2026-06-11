/**
 * BoardGraph: doubly-linked list of traversable tiles.
 *
 * Built from a BoardConfig + BoardSystem tile data.
 * Tiles with connectsTo: null are NOT linked into the traversal chain
 * — they exist for rendering only.
 */

import { TileData } from '@/types/game';
import { computeBoardLayout, ModifierLayout } from './BoardLayout';
import { BoardConfig } from './BoardConfig';
import { BoardTileNode, generatePawnSlots } from './BoardTile';

export class BoardGraph {
  /** Every tile including corners, keyed by id */
  private tilesById: Map<string, BoardTileNode> = new Map();
  /** Fast lookup by original index */
  private tilesByIndex: Map<number, BoardTileNode> = new Map();
  /** First traversable tile in the chain */
  private head: BoardTileNode | null = null;
  /** Modifier overlay layouts (not game tiles — rendering only) */
  private modifierLayouts: ModifierLayout[] = [];

  private constructor() {}

  // ── Factory ──────────────────────────────────────────────

  /**
   * Build the graph from a board config, pixel size, and tile data array.
   * Tiles are linked according to config connectsTo, not by index order.
   */
  static fromLayout(boardPixelSize: number, tileData: TileData[], config: BoardConfig): BoardGraph {
    const layoutResult = computeBoardLayout(boardPixelSize, config);
    const graph = new BoardGraph();

    // 1. Create all tile nodes
    for (const layout of layoutResult.tiles) {
      const data = tileData.find(t => t.index === layout.index);
      if (!data) continue;

      const node: BoardTileNode = {
        id: layout.id,
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

    // 2. Link tiles according to config connectsTo
    for (const tileConfig of config.tiles) {
      if (!tileConfig.connectsTo) continue;

      const source = graph.tilesById.get(tileConfig.id);
      const target = graph.tilesById.get(tileConfig.connectsTo);
      if (source && target) {
        source.next = target;
        target.prev = source;
      }
    }

    // 3. Set head to the config's start tile
    const startNode = graph.tilesById.get(config.startTileId);
    graph.head = startNode ?? null;

    // 4. Store modifier layouts for rendering
    graph.modifierLayouts = layoutResult.modifiers;

    return graph;
  }

  // ── Queries ──────────────────────────────────────────────

  getTileByIndex(index: number): BoardTileNode | null {
    return this.tilesByIndex.get(index) ?? null;
  }

  /** All tiles including corners (for rendering). */
  getAllTiles(): BoardTileNode[] {
    return Array.from(this.tilesById.values());
  }

  /** Modifier overlays (for rendering, not game tiles). */
  getModifiers(): ModifierLayout[] {
    return this.modifierLayouts;
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

  // ── Pawn Slots ───────────────────────────────────────────

  /**
   * Compute each player's pawn-slot offset from their tile's center.
   * Players sharing a tile take that tile's slot templates in array
   * order. Pure — derived from the players array, no graph state.
   */
  getSlotOffsets(
    players: { id: number; position: number }[]
  ): Map<number, { x: number; y: number }> {
    const offsets = new Map<number, { x: number; y: number }>();
    const byTile = new Map<number, { id: number; position: number }[]>();

    for (const player of players) {
      const group = byTile.get(player.position) ?? [];
      group.push(player);
      byTile.set(player.position, group);
    }

    for (const [position, group] of byTile) {
      const tile = this.tilesByIndex.get(position);
      group.forEach((player, i) => {
        const slot = tile?.pawnSlots[i];
        offsets.set(player.id, slot ? { x: slot.localX, y: slot.localY } : { x: 0, y: 0 });
      });
    }

    return offsets;
  }
}
