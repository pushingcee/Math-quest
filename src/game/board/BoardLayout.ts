/**
 * Pure math module: computes tile pixel positions from a board config.
 * No PixiJS dependency — just geometry.
 */

import { BoardConfig } from './BoardConfig';

export interface TileLayout {
  id: string;        // from config
  index: number;     // position in config.tiles array
  x: number;         // top-left x in pixels
  y: number;         // top-left y in pixels
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ModifierLayout {
  id: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface BoardLayoutResult {
  tiles: TileLayout[];
  modifiers: ModifierLayout[];
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
}

/** Gap in pixels between adjacent tiles (visible on all sides) */
export const TILE_GAP = 5;

/** Fixed world size in pixels the board is laid out at (750 * 1.15). */
export const BOARD_WORLD_SIZE = 863;

/**
 * Pixel rect for a tile at a 1-based grid position, inset by the tile gap.
 */
export function gridCellRect(
  row: number,
  col: number,
  span: number,
  cellSize: number
): { x: number; y: number; width: number; height: number } {
  const halfGap = TILE_GAP / 2;
  return {
    x: (col - 1) * cellSize + halfGap,
    y: (row - 1) * cellSize + halfGap,
    width: cellSize * span - TILE_GAP,
    height: cellSize * span - TILE_GAP,
  };
}

/**
 * Compute pixel positions for all tiles defined in a BoardConfig.
 *
 * Each tile's row/col/span determines its grid position and size.
 * cellSize = boardPixelSize / max(gridCols, gridRows) (square cells).
 */
export function computeBoardLayout(
  boardPixelSize: number,
  config: BoardConfig
): BoardLayoutResult {
  const gridMax = Math.max(config.gridCols, config.gridRows);
  const cellSize = boardPixelSize / gridMax;
  const tiles: TileLayout[] = [];
  const modifiers: ModifierLayout[] = [];
  let gameIndex = 0;

  for (let i = 0; i < config.tiles.length; i++) {
    const tile = config.tiles[i];
    const { x, y, width: w, height: h } = gridCellRect(tile.row, tile.col, tile.span ?? 1, cellSize);

    if (tile.type === 'modifier') {
      modifiers.push({
        id: tile.id,
        label: tile.label,
        x, y, width: w, height: h,
        centerX: x + w / 2,
        centerY: y + h / 2,
      });
    } else {
      tiles.push({
        id: tile.id,
        index: gameIndex++,
        x, y, width: w, height: h,
        centerX: x + w / 2,
        centerY: y + h / 2,
      });
    }
  }

  return {
    tiles,
    modifiers,
    boardWidth: boardPixelSize,
    boardHeight: boardPixelSize,
    cellSize,
  };
}
