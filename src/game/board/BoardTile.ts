/**
 * BoardTileNode: a node in the doubly-linked board.
 *
 * Each tile owns its pixel layout and pawn slots, so rendering code
 * never needs to compute positions externally.
 */

import { TileData } from '@/types/game';
import { TileLayout } from './BoardLayout';

export interface PawnSlot {
  localX: number; // offset from tile center
  localY: number;
  playerId: number | null;
}

export interface BoardTileNode {
  id: string;
  index: number;
  tileData: TileData;
  layout: TileLayout;
  pawnSlots: PawnSlot[];
  next: BoardTileNode | null;
  prev: BoardTileNode | null;
}

/**
 * Generate pawn slots in a diamond pattern around a tile's center.
 * Slots are offsets relative to the tile center — the renderer adds
 * these to centerX/centerY.
 */
export function generatePawnSlots(
  tileLayout: TileLayout,
  maxSlots: number = 4
): PawnSlot[] {
  // Scale spacing based on tile size (corners are 2x2, regulars 1x1)
  const spacing = Math.min(tileLayout.width, tileLayout.height) * 0.25;

  // Diamond offsets from center
  const offsets = [
    { x: -spacing / 2, y: -spacing / 2 },
    { x: spacing / 2, y: -spacing / 2 },
    { x: -spacing / 2, y: spacing / 2 },
    { x: spacing / 2, y: spacing / 2 },
  ];

  return offsets.slice(0, maxSlots).map((o) => ({
    localX: o.x,
    localY: o.y,
    playerId: null,
  }));
}
