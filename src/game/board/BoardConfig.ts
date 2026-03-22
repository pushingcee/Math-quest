/**
 * Declarative board configuration.
 *
 * Each tile declares its grid position, type, and which tile it connects to.
 * The engine and renderer consume this config to build the board — no
 * hardcoded tile positions in game logic.
 */

export interface TileConfig {
  id: string;                // unique identifier, e.g. "start", "t1", "shop-1"
  row: number;               // 1-based grid row
  col: number;               // 1-based grid column
  type: 'regular' | 'shop' | 'obstacle' | 'corner' | 'modifier';
  connectsTo: string | null; // id of next tile in traversal, null = not traversable
  obstacleType?: 'slip' | 'trap';
  pointsMultiplier?: number;
  label?: string;
  onLand?: { scoreChange: number; message: string; messageNoDeduct?: string };
  modifierEffect?: { pointsMultiplier?: number };
  span?: number;             // grid cells wide/tall (default 1, corners use 2)
}

export interface BoardConfig {
  id: string;
  name: string;
  gridCols: number;
  gridRows: number;
  startTileId: string;       // first traversable tile (where movement begins)
  tiles: TileConfig[];
}
