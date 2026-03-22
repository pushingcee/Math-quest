import { BoardConfig, TileConfig } from './BoardConfig';

const VALID_TILE_TYPES: TileConfig['type'][] = ['regular', 'shop', 'obstacle', 'corner', 'modifier'];
const VALID_OBSTACLE_TYPES: NonNullable<TileConfig['obstacleType']>[] = ['slip', 'trap'];

export class BoardConfigLoader {
  /**
   * Parse and validate a raw JSON object into a BoardConfig.
   * Throws descriptive errors on invalid data.
   */
  static parse(raw: unknown): BoardConfig {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Board config must be a non-null object');
    }

    const obj = raw as Record<string, unknown>;

    if (typeof obj.id !== 'string') throw new Error('Board config missing "id" (string)');
    if (typeof obj.name !== 'string') throw new Error('Board config missing "name" (string)');
    if (typeof obj.gridCols !== 'number') throw new Error('Board config missing "gridCols" (number)');
    if (typeof obj.gridRows !== 'number') throw new Error('Board config missing "gridRows" (number)');
    if (typeof obj.startTileId !== 'string') throw new Error('Board config missing "startTileId" (string)');
    if (!Array.isArray(obj.tiles)) throw new Error('Board config missing "tiles" (array)');

    const tiles = obj.tiles.map((t: unknown, i: number) => this.parseTile(t, i));

    // Validate tile id uniqueness
    const ids = new Set<string>();
    for (const tile of tiles) {
      if (ids.has(tile.id)) throw new Error(`Duplicate tile id: "${tile.id}"`);
      ids.add(tile.id);
    }

    // Validate connectsTo references
    for (const tile of tiles) {
      if (tile.connectsTo !== null && !ids.has(tile.connectsTo)) {
        throw new Error(`Tile "${tile.id}" connectsTo unknown tile "${tile.connectsTo}"`);
      }
    }

    // Validate startTileId exists
    if (!ids.has(obj.startTileId as string)) {
      throw new Error(`startTileId "${obj.startTileId}" does not match any tile id`);
    }

    return {
      id: obj.id as string,
      name: obj.name as string,
      gridCols: obj.gridCols as number,
      gridRows: obj.gridRows as number,
      startTileId: obj.startTileId as string,
      tiles,
    };
  }

  private static parseTile(raw: unknown, index: number): TileConfig {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Tile at index ${index} must be a non-null object`);
    }

    const t = raw as Record<string, unknown>;

    if (typeof t.id !== 'string') throw new Error(`Tile ${index}: missing "id" (string)`);
    if (typeof t.row !== 'number') throw new Error(`Tile "${t.id}": missing "row" (number)`);
    if (typeof t.col !== 'number') throw new Error(`Tile "${t.id}": missing "col" (number)`);
    if (!VALID_TILE_TYPES.includes(t.type as TileConfig['type'])) {
      throw new Error(`Tile "${t.id}": invalid type "${t.type}" (expected: ${VALID_TILE_TYPES.join(', ')})`);
    }
    if (t.connectsTo !== null && typeof t.connectsTo !== 'string') {
      throw new Error(`Tile "${t.id}": "connectsTo" must be a string or null`);
    }

    if (t.obstacleType !== undefined && !VALID_OBSTACLE_TYPES.includes(t.obstacleType as NonNullable<TileConfig['obstacleType']>)) {
      throw new Error(`Tile "${t.id}": invalid obstacleType "${t.obstacleType}"`);
    }

    const tile: TileConfig = {
      id: t.id as string,
      row: t.row as number,
      col: t.col as number,
      type: t.type as TileConfig['type'],
      connectsTo: (t.connectsTo as string | null) ?? null,
    };

    if (t.obstacleType !== undefined) tile.obstacleType = t.obstacleType as TileConfig['obstacleType'];
    if (t.pointsMultiplier !== undefined) tile.pointsMultiplier = t.pointsMultiplier as number;
    if (t.label !== undefined) tile.label = t.label as string;
    if (t.span !== undefined) tile.span = t.span as number;
    if (t.onLand !== undefined) tile.onLand = t.onLand as TileConfig['onLand'];
    if (t.modifierEffect !== undefined) {
      const eff = t.modifierEffect as Record<string, unknown>;
      if (typeof eff !== 'object' || eff === null) {
        throw new Error(`Tile "${tile.id}": modifierEffect must be an object`);
      }
      tile.modifierEffect = {
        pointsMultiplier: typeof eff.pointsMultiplier === 'number' ? eff.pointsMultiplier : undefined,
      };
    }

    if (tile.type === 'modifier') {
      if (tile.connectsTo !== null) {
        throw new Error(`Tile "${tile.id}": modifier tiles must have connectsTo: null`);
      }
      if (!tile.modifierEffect) {
        throw new Error(`Tile "${tile.id}": modifier tiles must have modifierEffect`);
      }
    }

    return tile;
  }

  /**
   * Load a board config from a JSON string.
   */
  static fromJSON(json: string): BoardConfig {
    return this.parse(JSON.parse(json));
  }
}
