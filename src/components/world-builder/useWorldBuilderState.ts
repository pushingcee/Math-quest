import { useState, useCallback } from 'react';
import { EditorTile, EditorState, PaletteType } from './worldBuilderTypes';
import { BoardConfigLoader } from '@/game/board/BoardConfigLoader';
import { TileConfig, BoardConfig } from '@/game/board/BoardConfig';
import defaultBoardJson from '@/game/board/boards/default.board.json';

// ── helpers ────────────────────────────────────────────────────────────────

function tileConfigToEditorTile(t: TileConfig): EditorTile {
  return {
    id: t.id,
    row: t.row,
    col: t.col,
    span: t.span ?? 1,
    type: t.type,
    connectsTo: t.connectsTo,
    obstacleType: t.obstacleType,
    label: t.label,
    onLand: t.onLand ? { scoreChange: t.onLand.scoreChange, message: t.onLand.message } : undefined,
    modifierEffect: t.modifierEffect,
  };
}

export function editorTileToTileConfig(t: EditorTile): TileConfig {
  const cfg: TileConfig = {
    id: t.id,
    row: t.row,
    col: t.col,
    type: t.type,
    connectsTo: t.connectsTo,
  };
  if (t.span !== 1) cfg.span = t.span;
  if (t.obstacleType) cfg.obstacleType = t.obstacleType;
  if (t.label !== undefined) cfg.label = t.label;
  if (t.onLand) cfg.onLand = t.onLand;
  if (t.modifierEffect) cfg.modifierEffect = t.modifierEffect;
  return cfg;
}

/** Build a set of all grid cells occupied by a tile (for collision checking). */
function occupiedKeys(t: EditorTile): string[] {
  const keys: string[] = [];
  for (let dr = 0; dr < t.span; dr++) {
    for (let dc = 0; dc < t.span; dc++) {
      keys.push(`${t.row + dr},${t.col + dc}`);
    }
  }
  return keys;
}

function buildOccupiedMap(tiles: EditorTile[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of tiles) {
    for (const key of occupiedKeys(t)) {
      map.set(key, t.id);
    }
  }
  return map;
}

function isColliding(
  row: number,
  col: number,
  span: number,
  excludeId: string | null,
  occupied: Map<string, string>,
  gridCols: number,
  gridRows: number,
): boolean {
  // Bounds check
  if (row < 1 || col < 1 || row + span - 1 > gridRows || col + span - 1 > gridCols) return true;
  for (let dr = 0; dr < span; dr++) {
    for (let dc = 0; dc < span; dc++) {
      const key = `${row + dr},${col + dc}`;
      const existing = occupied.get(key);
      if (existing && existing !== excludeId) return true;
    }
  }
  return false;
}

function spanForPalette(palette: PaletteType): number {
  return palette === 'shop' || palette === 'corner' || palette === 'modifier' ? 2 : 1;
}

function typeForPalette(palette: PaletteType): EditorTile['type'] {
  if (palette === 'obstacle-slip' || palette === 'obstacle-trap') return 'obstacle';
  if (palette === 'eraser') return 'regular'; // never actually placed
  return palette as EditorTile['type'];
}

function generateId(type: EditorTile['type'], tiles: EditorTile[]): string {
  const prefix =
    type === 'regular' ? 't'
    : type === 'obstacle' ? 'obs-'
    : type === 'shop' ? 'shop-'
    : type === 'corner' ? 'corner-'
    : 'mod-';
  const existing = new Set(tiles.map((t) => t.id));
  let n = 1;
  while (existing.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

function stateFromConfig(config: BoardConfig): EditorState {
  return {
    boardId: config.id,
    boardName: config.name,
    gridCols: config.gridCols,
    gridRows: config.gridRows,
    startTileId: config.startTileId,
    tiles: config.tiles.map(tileConfigToEditorTile),
    selectedTileId: null,
    connectMode: false,
    activePalette: 'regular',
  };
}

// ── hook ───────────────────────────────────────────────────────────────────

export function useWorldBuilderState() {
  const [state, setState] = useState<EditorState>(() =>
    stateFromConfig(BoardConfigLoader.parse(defaultBoardJson))
  );

  // ── palette ──

  const setActivePalette = useCallback((palette: PaletteType) => {
    setState((s) => ({ ...s, activePalette: palette, connectMode: false }));
  }, []);

  // ── tile placement ──

  const placeTile = useCallback((row: number, col: number) => {
    setState((s) => {
      if (s.activePalette === 'eraser') return s;
      const span = spanForPalette(s.activePalette);
      const type = typeForPalette(s.activePalette);
      const occupied = buildOccupiedMap(s.tiles);
      if (isColliding(row, col, span, null, occupied, s.gridCols, s.gridRows)) return s;
      const id = generateId(type, s.tiles);
      const tile: EditorTile = {
        id,
        row,
        col,
        span,
        type,
        connectsTo: null,
        obstacleType:
          s.activePalette === 'obstacle-slip' ? 'slip'
          : s.activePalette === 'obstacle-trap' ? 'trap'
          : undefined,
        modifierEffect: type === 'modifier' ? { pointsMultiplier: 2 } : undefined,
      };
      return { ...s, tiles: [...s.tiles, tile], selectedTileId: id };
    });
  }, []);

  const removeTile = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tiles: s.tiles
        .filter((t) => t.id !== id)
        .map((t) => (t.connectsTo === id ? { ...t, connectsTo: null } : t)),
      selectedTileId: s.selectedTileId === id ? null : s.selectedTileId,
      startTileId: s.startTileId === id ? '' : s.startTileId,
      connectMode: false,
    }));
  }, []);

  const moveTile = useCallback((id: string, newRow: number, newCol: number) => {
    setState((s) => {
      const tile = s.tiles.find((t) => t.id === id);
      if (!tile) return s;
      const occupied = buildOccupiedMap(s.tiles);
      if (isColliding(newRow, newCol, tile.span, id, occupied, s.gridCols, s.gridRows)) return s;
      return {
        ...s,
        tiles: s.tiles.map((t) => (t.id === id ? { ...t, row: newRow, col: newCol } : t)),
      };
    });
  }, []);

  const updateTile = useCallback((id: string, patch: Partial<EditorTile>) => {
    setState((s) => {
      const oldTile = s.tiles.find((t) => t.id === id);
      if (!oldTile) return s;
      const newId = patch.id ?? id;
      const idChanged = newId !== id;
      // Prevent duplicate IDs
      if (idChanged && s.tiles.some((t) => t.id === newId)) return s;
      // Prevent self-connection
      if (patch.connectsTo === id || patch.connectsTo === newId) return s;
      return {
        ...s,
        startTileId: idChanged && s.startTileId === id ? newId : s.startTileId,
        selectedTileId: idChanged && s.selectedTileId === id ? newId : s.selectedTileId,
        tiles: s.tiles.map((t) => {
          if (t.id === id) return { ...t, ...patch, id: newId };
          // Update connectsTo references if ID changed
          if (idChanged && t.connectsTo === id) return { ...t, connectsTo: newId };
          return t;
        }),
      };
    });
  }, []);

  // ── selection ──

  const selectTile = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedTileId: id, connectMode: false }));
  }, []);

  const enterConnectMode = useCallback(() => {
    setState((s) => {
      if (!s.selectedTileId) return s;
      return { ...s, connectMode: true };
    });
  }, []);

  const resolveConnection = useCallback((targetId: string) => {
    setState((s) => {
      if (!s.selectedTileId || !s.connectMode) return s;
      if (targetId === s.selectedTileId) return { ...s, connectMode: false }; // no self-link
      return {
        ...s,
        connectMode: false,
        tiles: s.tiles.map((t) =>
          t.id === s.selectedTileId ? { ...t, connectsTo: targetId } : t
        ),
      };
    });
  }, []);

  const clearConnection = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tiles: s.tiles.map((t) => (t.id === id ? { ...t, connectsTo: null } : t)),
    }));
  }, []);

  const cancelConnectMode = useCallback(() => {
    setState((s) => ({ ...s, connectMode: false }));
  }, []);

  // ── board meta ──

  const setBoardName = useCallback((name: string) => {
    setState((s) => ({ ...s, boardName: name }));
  }, []);

  const setStartTileId = useCallback((id: string) => {
    setState((s) => ({ ...s, startTileId: id }));
  }, []);

  // ── import / export ──

  const exportJSON = useCallback((): string | null => {
    const config: BoardConfig = {
      id: state.boardId || 'custom',
      name: state.boardName || 'Custom Board',
      gridCols: state.gridCols,
      gridRows: state.gridRows,
      startTileId: state.startTileId,
      tiles: state.tiles.map(editorTileToTileConfig),
    };
    try {
      BoardConfigLoader.parse(config);
      return JSON.stringify(config, null, 2);
    } catch (e) {
      alert(`Export error: ${(e as Error).message}`);
      return null;
    }
  }, [state]);

  const importJSON = useCallback((json: string) => {
    try {
      const config = BoardConfigLoader.fromJSON(json);
      setState(stateFromConfig(config));
    } catch (e) {
      alert(`Import error: ${(e as Error).message}`);
    }
  }, []);

  const loadDefault = useCallback(() => {
    setState(stateFromConfig(BoardConfigLoader.parse(defaultBoardJson)));
  }, []);

  return {
    state,
    placeTile,
    removeTile,
    moveTile,
    updateTile,
    selectTile,
    setActivePalette,
    enterConnectMode,
    resolveConnection,
    clearConnection,
    cancelConnectMode,
    setBoardName,
    setStartTileId,
    exportJSON,
    importJSON,
    loadDefault,
  };
}
