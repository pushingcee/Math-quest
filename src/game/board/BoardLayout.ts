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
  const halfGap = TILE_GAP / 2;
  let gameIndex = 0;

  for (let i = 0; i < config.tiles.length; i++) {
    const tile = config.tiles[i];
    const span = tile.span ?? 1;

    const w = cellSize * span - TILE_GAP;
    const h = cellSize * span - TILE_GAP;
    // Convert 1-based grid position to 0-based pixel position, then inset
    const x = (tile.col - 1) * cellSize + halfGap;
    const y = (tile.row - 1) * cellSize + halfGap;

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
