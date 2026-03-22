/**
 * Pure math module: computes tile pixel positions from a board pixel size.
 * No PixiJS dependency — just geometry matching the 13×13 grid layout.
 */

export interface TileLayout {
  index: number;
  x: number;       // top-left x in pixels
  y: number;       // top-left y in pixels
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface BoardLayoutResult {
  tiles: TileLayout[];
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
}

/**
 * Compute pixel positions for all 40 board tiles (indices 0-39).
 *
 * The board is a 13×13 grid. Each cell is `cellSize = boardPixelSize / 13`.
 * Corner tiles (indices 0, 10, 20, 30) span 2×2 cells.
 * Regular tiles span 1×1 cell.
 *
 * Corners occupy the four grid corners (2×2 each), leaving 9 non-overlapping
 * positions per side (cols/rows 3-11) for regular tiles:
 *
 *   Corner 0  (START):     cols 12-13, rows 12-13 (bottom-right)
 *   Corner 10 (BONUS):     cols 1-2,   rows 12-13 (bottom-left)
 *   Corner 20 (CHALLENGE): cols 1-2,   rows 1-2   (top-left)
 *   Corner 30 (PENALTY):   cols 12-13, rows 1-2   (top-right)
 *
 *   Bottom row (tiles 1-9):   row 13, cols 11→3  (right→left)
 *   Left column (tiles 11-19): col 1,  rows 11→3 (bottom→top)
 *   Top row (tiles 21-29):    row 1,  cols 3→11  (left→right)
 *   Right column (tiles 31-39): col 13, rows 3→11 (top→bottom)
 */
/** Gap in pixels between adjacent tiles (visible on all sides) */
export const TILE_GAP = 5;

export function computeBoardLayout(boardPixelSize: number): BoardLayoutResult {
  const cellSize = boardPixelSize / 13;
  const tiles: TileLayout[] = [];
  const halfGap = TILE_GAP / 2;

  for (let index = 0; index < 40; index++) {
    const pos = getTileGridPosition(index);
    const isCorner = [0, 10, 20, 30].includes(index);
    const spanCells = isCorner ? 2 : 1;
    // Inset by half the gap on each side so adjacent tiles have a full TILE_GAP between them
    const w = cellSize * spanCells - TILE_GAP;
    const h = cellSize * spanCells - TILE_GAP;
    // Convert 1-based grid position to 0-based pixel position, then inset
    const x = (pos.col - 1) * cellSize + halfGap;
    const y = (pos.row - 1) * cellSize + halfGap;

    tiles.push({
      index,
      x,
      y,
      width: w,
      height: h,
      centerX: x + w / 2,
      centerY: y + h / 2,
    });
  }

  return {
    tiles,
    boardWidth: boardPixelSize,
    boardHeight: boardPixelSize,
    cellSize,
  };
}

function getTileGridPosition(index: number): { col: number; row: number } {
  // Corner tiles (2×2, anchored at their top-left cell)
  if (index === 0)  return { col: 12, row: 12 };
  if (index === 10) return { col: 1,  row: 12 };
  if (index === 20) return { col: 1,  row: 1  };
  if (index === 30) return { col: 12, row: 1  };

  // Bottom row (tiles 1-9): right to left, row 13, cols 11→3
  if (index < 10) {
    return { col: 12 - index, row: 13 };
  }
  // Left column (tiles 11-19): bottom to top, col 1, rows 11→3
  if (index < 20) {
    return { col: 1, row: 22 - index };
  }
  // Top row (tiles 21-29): left to right, row 1, cols 3→11
  if (index < 30) {
    return { col: index - 18, row: 1 };
  }
  // Right column (tiles 31-39): top to bottom, col 13, rows 3→11
  return { col: 13, row: index - 28 };
}
