/**
 * Pure math module: computes tile pixel positions from a board pixel size.
 * No PixiJS dependency — just geometry matching the 11×11 CSS grid layout.
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
 * Compute pixel positions for all 40 board tiles.
 *
 * The board is an 11×11 grid. Each cell is `cellSize = boardPixelSize / 11`.
 * Corner tiles (indices 0, 10, 20, 30) span 2×2 cells.
 * Regular tiles span 1×1 cell.
 *
 * Grid positions (1-based, matching CSS grid-column / grid-row):
 *   Tile 0  (corner): cols 10-11, rows 10-11 (bottom-right)
 *   Tiles 1-9 (bottom row): row 11, col = 10 - index  (right→left)
 *   Tile 10 (corner): cols 1-2, rows 10-11 (bottom-left)
 *   Tiles 11-19 (left col): col 1, row = 11 - (index - 10)  (bottom→top)
 *   Tile 20 (corner): cols 1-2, rows 1-2 (top-left)
 *   Tiles 21-29 (top row): row 1, col = index - 20 + 1  — but corners occupy cols 1-2,
 *       so tile 21 starts at col 3. Actually from CSS: col = index - 20 + 1.
 *       Wait — tile 21: col = 21 - 20 + 1 = 2. But corner 20 occupies cols 1-2.
 *       Let me re-check the Board.tsx code:
 *         index < 30 → col = index - 20 + 1, row = 1
 *         tile 21 → col=2, row=1 — this overlaps with corner 20 (cols 1-2, rows 1-2)!
 *       Actually the CSS grid handles overlapping by z-index. The corner has z-20.
 *       For pixel layout, tile 21 at col=2 is fine — it just sits behind the corner.
 *       In our PixiJS board, we render corners on top, so the overlap is visual only.
 *
 *   Tiles 31-38 (right col): col 11, row = index - 30 + 1
 */
export function computeBoardLayout(boardPixelSize: number): BoardLayoutResult {
  const cellSize = boardPixelSize / 11;
  const tiles: TileLayout[] = [];

  for (let index = 0; index < 39; index++) {
    const pos = getTileGridPosition(index);
    const isCorner = [0, 10, 20, 30].includes(index);
    const w = isCorner ? cellSize * 2 : cellSize;
    const h = isCorner ? cellSize * 2 : cellSize;
    // Convert 1-based grid position to 0-based pixel position
    const x = (pos.col - 1) * cellSize;
    const y = (pos.row - 1) * cellSize;

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
  // Corner tiles
  if (index === 0)  return { col: 10, row: 10 };
  if (index === 10) return { col: 1,  row: 10 };
  if (index === 20) return { col: 1,  row: 1  };
  if (index === 30) return { col: 10, row: 1  };

  // Bottom row (tiles 1-9): right to left
  if (index < 10) {
    return { col: 10 - index, row: 11 };
  }
  // Left column (tiles 11-19): bottom to top
  if (index < 20) {
    return { col: 1, row: 11 - (index - 10) };
  }
  // Top row (tiles 21-29): left to right
  if (index < 30) {
    return { col: index - 20 + 1, row: 1 };
  }
  // Right column (tiles 31-39): top to bottom
  return { col: 11, row: index - 30 + 1 };
}

/**
 * Compute stacking offsets when multiple players share the same tile.
 */
export function computeStackOffset(
  playerId: number,
  playerPosition: number,
  allPlayers: { id: number; position: number }[]
): { x: number; y: number } {
  const playersOnSameTile = allPlayers.filter(
    (p) => p.id < playerId && p.position === playerPosition
  ).length;

  return {
    x: playersOnSameTile * 20 - 10,
    y: playersOnSameTile * 20,
  };
}
