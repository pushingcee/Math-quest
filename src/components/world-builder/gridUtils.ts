/**
 * Shared grid helpers for the world builder (state hook + canvas).
 */
import { EditorTile } from './worldBuilderTypes';

/** Build a set of all grid cells occupied by a tile (for collision checking). */
export function occupiedKeys(t: EditorTile): string[] {
  const keys: string[] = [];
  for (let dr = 0; dr < t.span; dr++) {
    for (let dc = 0; dc < t.span; dc++) {
      keys.push(`${t.row + dr},${t.col + dc}`);
    }
  }
  return keys;
}

/** Map of "row,col" → tile id for every occupied cell (O(1) hit detection). */
export function buildOccupiedMap(tiles: EditorTile[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of tiles) {
    for (const key of occupiedKeys(t)) {
      map.set(key, t.id);
    }
  }
  return map;
}
