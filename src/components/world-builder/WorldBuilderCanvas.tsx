'use client';

import { useRef, useCallback, useMemo } from 'react';
import { Application, extend } from '@pixi/react';
import {
  Container,
  Graphics as PixiGraphics,
  Text as PixiText,
  FederatedPointerEvent,
} from 'pixi.js';
import { EditorState, EditorTile, DragState, GroupOffset } from './worldBuilderTypes';
import { TILE_GAP } from '@/game/board/BoardLayout';

extend({ Container, Graphics: PixiGraphics, Text: PixiText });

const WORLD_SIZE = 863;
const DRAG_THRESHOLD = 4; // px — below this = click, above = drag

// ── colours ─────────────────────────────────────────────────────────────────
const C = {
  gridBg:         0x1e293b, // slate-800  (canvas background)
  emptyCell:      0x334155, // slate-700  (unoccupied cell)
  regular:        0x92400e, // amber-800  (bronze-ish)
  obstacleSlip:   0x93c5fd, // blue-300
  obstacleTrap:   0xfca5a5, // red-300
  shop:           0xfbbf24, // yellow-400
  corner:         0xfb7185, // rose-400
  modifier:       0xf59e0b, // amber-500  (gold)
  tileText:       0xffffff,
  idText:         0xffffff,
  subtitleText:   0xe2e8f0,
  border:         0x475569,
  selected:       0x38bdf8, // sky-400
  connectSrc:     0x4ade80, // green-400
  connectTarget:  0x22d3ee, // cyan-400
  arrowNormal:    0xffffff,
  arrowSelected:  0x38bdf8,
  ghost:          0x60a5fa, // blue-400
  marquee:        0x38bdf8, // sky-400
};

// ── helpers ──────────────────────────────────────────────────────────────────

function tileColor(t: EditorTile): number {
  if (t.type === 'corner') return C.corner;
  if (t.type === 'shop') return C.shop;
  if (t.type === 'modifier') return C.modifier;
  if (t.type === 'obstacle') return t.obstacleType === 'slip' ? C.obstacleSlip : C.obstacleTrap;
  return C.regular;
}

function buildLayoutMap(tiles: EditorTile[], gridCols: number, gridRows: number) {
  // Compute pixel positions for every tile including modifiers (we bypass
  // computeBoardLayout here so we get layouts for all tile types uniformly).
  const map = new Map<string, { x: number; y: number; w: number; h: number; cx: number; cy: number }>();
  const gridMax = Math.max(gridCols, gridRows);
  const cellSize = WORLD_SIZE / gridMax;
  const halfGap = TILE_GAP / 2;
  for (const t of tiles) {
    const span = t.span ?? 1;
    const w = cellSize * span - TILE_GAP;
    const h = cellSize * span - TILE_GAP;
    const x = (t.col - 1) * cellSize + halfGap;
    const y = (t.row - 1) * cellSize + halfGap;
    map.set(t.id, { x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
  }
  return { map, cellSize };
}

function drawArrow(
  g: PixiGraphics,
  fromX: number, fromY: number,
  toX: number, toY: number,
  color: number,
) {
  const ARROW_HEAD = 8;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);
  const srcOff = 8;
  const dstOff = 12;
  const sx = fromX + Math.cos(angle) * srcOff;
  const sy = fromY + Math.sin(angle) * srcOff;
  const ex = toX - Math.cos(angle) * dstOff;
  const ey = toY - Math.sin(angle) * dstOff;
  g.moveTo(sx, sy).lineTo(ex, ey).stroke({ color, width: 1.5, alpha: 0.85 });
  g.moveTo(ex, ey)
    .lineTo(
      ex - ARROW_HEAD * Math.cos(angle - 0.4),
      ey - ARROW_HEAD * Math.sin(angle - 0.4),
    )
    .lineTo(
      ex - ARROW_HEAD * Math.cos(angle + 0.4),
      ey - ARROW_HEAD * Math.sin(angle + 0.4),
    )
    .closePath()
    .fill({ color, alpha: 0.9 });
}

// ── inner canvas component ────────────────────────────────────────────────────

interface RectSelectState {
  startX: number;   // local PixiJS coords
  startY: number;
  currentX: number;
  currentY: number;
}

interface CanvasContentProps {
  editorState: EditorState;
  onPlaceTile: (row: number, col: number) => void;
  onSelectTile: (id: string | null, additive?: boolean) => void;
  onSelectTiles: (ids: string[]) => void;
  onMoveTile: (id: string, row: number, col: number) => void;
  onMoveSelectedTiles: (anchorId: string, newRow: number, newCol: number, offsets: GroupOffset[]) => void;
  onResolveConnection: (id: string) => void;
  onCancelConnectMode: () => void;
  viewportSize: number;
}

function WorldBuilderCanvasContent({
  editorState,
  onPlaceTile,
  onSelectTile,
  onSelectTiles,
  onMoveTile,
  onMoveSelectedTiles,
  onResolveConnection,
  onCancelConnectMode,
  viewportSize,
}: CanvasContentProps) {
  const { tiles, selectedTileIds, connectMode, activePalette, gridCols, gridRows } = editorState;

  const selectedSet = useMemo(() => new Set(selectedTileIds), [selectedTileIds]);

  // Keep a ref to the latest editor state so PixiJS event handlers
  // (which @pixi/react may not re-attach on every render) always
  // read fresh values instead of stale closure captures.
  const stateRef = useRef(editorState);
  stateRef.current = editorState;

  const dragRef = useRef<DragState | null>(null);
  const rectSelectRef = useRef<RectSelectState | null>(null);
  const ghostGfxRef = useRef<PixiGraphics | null>(null);
  const rectGfxRef = useRef<PixiGraphics | null>(null);
  const ghostContainerRef = useRef<Container | null>(null);

  const { map: layoutMap, cellSize } = useMemo(
    () => buildLayoutMap(tiles, gridCols, gridRows),
    [tiles, gridCols, gridRows],
  );

  // Build occupied-cell lookup map (O(1) hit detection)
  const occupiedMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tiles) {
      for (let dr = 0; dr < t.span; dr++) {
        for (let dc = 0; dc < t.span; dc++) {
          m.set(`${t.row + dr},${t.col + dc}`, t.id);
        }
      }
    }
    return m;
  }, [tiles]);

  // Grid coordinates from PixiJS local position
  const localToGrid = useCallback(
    (localX: number, localY: number) => ({
      row: Math.floor(localY / cellSize) + 1,
      col: Math.floor(localX / cellSize) + 1,
    }),
    [cellSize],
  );

  // Hit-test: which tile (if any) is at grid (row, col)?
  const tileAtGrid = useCallback(
    (row: number, col: number): string | null => occupiedMap.get(`${row},${col}`) ?? null,
    [occupiedMap],
  );

  // ── ghost drawing ──────────────────────────────────────────────────────────

  const drawGhost = useCallback(
    (g: PixiGraphics, localX: number, localY: number) => {
      g.clear();
      if (!dragRef.current?.isDragging) return;
      const halfGap = TILE_GAP / 2;
      const snapCol = Math.floor(localX / cellSize);
      const snapRow = Math.floor(localY / cellSize);
      for (const off of dragRef.current.groupOffsets) {
        const tile = tiles.find((t) => t.id === off.tileId);
        if (!tile) continue;
        const size = cellSize * tile.span - TILE_GAP;
        const gx = (snapCol + off.dCol) * cellSize + halfGap;
        const gy = (snapRow + off.dRow) * cellSize + halfGap;
        g.rect(gx, gy, size, size)
          .fill({ color: C.ghost, alpha: 0.55 })
          .stroke({ color: C.ghost, width: 2 });
      }
    },
    [tiles, cellSize],
  );

  // ── pointer handlers on world container ───────────────────────────────────

  const handleWorldPointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      const local = e.getLocalPosition(e.currentTarget as Container);

      // Marquee selection drag
      if (rectSelectRef.current) {
        rectSelectRef.current.currentX = local.x;
        rectSelectRef.current.currentY = local.y;
        if (rectGfxRef.current) {
          const rs = rectSelectRef.current;
          const rx = Math.min(rs.startX, rs.currentX);
          const ry = Math.min(rs.startY, rs.currentY);
          const rw = Math.abs(rs.currentX - rs.startX);
          const rh = Math.abs(rs.currentY - rs.startY);
          rectGfxRef.current.clear();
          rectGfxRef.current
            .rect(rx, ry, rw, rh)
            .fill({ color: C.marquee, alpha: 0.12 })
            .stroke({ color: C.marquee, width: 1.5, alpha: 0.7 });
        }
        return;
      }

      // Tile drag
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragRef.current.isDragging = true;
      }
      if (dragRef.current.isDragging && ghostGfxRef.current) {
        drawGhost(ghostGfxRef.current, local.x, local.y);
      }
    },
    [drawGhost],
  );

  const handleWorldPointerUp = useCallback(
    (e: FederatedPointerEvent) => {
      // Marquee selection release
      if (rectSelectRef.current) {
        const rs = rectSelectRef.current;
        rectSelectRef.current = null;
        if (rectGfxRef.current) rectGfxRef.current.clear();

        // Find all tiles whose layout overlaps the marquee rectangle
        const rx1 = Math.min(rs.startX, rs.currentX);
        const ry1 = Math.min(rs.startY, rs.currentY);
        const rx2 = Math.max(rs.startX, rs.currentX);
        const ry2 = Math.max(rs.startY, rs.currentY);
        const { tiles: allTiles } = stateRef.current;
        const hits: string[] = [];
        for (const t of allTiles) {
          const lo = layoutMap.get(t.id);
          if (!lo) continue;
          // AABB overlap test
          if (lo.x < rx2 && lo.x + lo.w > rx1 && lo.y < ry2 && lo.y + lo.h > ry1) {
            hits.push(t.id);
          }
        }
        onSelectTiles(hits);
        return;
      }

      // Tile drag release
      if (!dragRef.current) return;
      const drag = dragRef.current;
      dragRef.current = null;

      if (ghostGfxRef.current) ghostGfxRef.current.clear();

      const local = e.getLocalPosition(e.currentTarget as Container);
      const { row, col } = localToGrid(local.x, local.y);

      if (drag.isDragging) {
        if (drag.groupOffsets.length > 1) {
          onMoveSelectedTiles(drag.tileId, row, col, drag.groupOffsets);
        } else {
          onMoveTile(drag.tileId, row, col);
        }
      }
    },
    [localToGrid, layoutMap, onMoveTile, onMoveSelectedTiles, onSelectTiles],
  );

  // ── pointer handlers per tile ─────────────────────────────────────────────

  const handleTilePointerDown = useCallback(
    (e: FederatedPointerEvent, tileId: string) => {
      e.stopPropagation();
      const { selectedTileIds: sel, tiles: allTiles } = stateRef.current;
      const selected = new Set(sel);
      const anchor = allTiles.find((t) => t.id === tileId);
      if (!anchor) return;

      // Build group offsets: if anchor is part of selection, move the whole group
      let groupOffsets: GroupOffset[];
      if (selected.has(tileId) && selected.size > 1) {
        groupOffsets = allTiles
          .filter((t) => selected.has(t.id))
          .map((t) => ({ tileId: t.id, dRow: t.row - anchor.row, dCol: t.col - anchor.col }));
      } else {
        groupOffsets = [{ tileId, dRow: 0, dCol: 0 }];
      }

      dragRef.current = {
        tileId,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false,
        groupOffsets,
      };
    },
    [],
  );

  const handleTilePointerUp = useCallback(
    (e: FederatedPointerEvent, tileId: string) => {
      e.stopPropagation();
      const wasDragging = dragRef.current?.isDragging ?? false;
      dragRef.current = null;
      if (ghostGfxRef.current) ghostGfxRef.current.clear();

      if (!wasDragging) {
        const { connectMode: cm, selectedTileIds: sel } = stateRef.current;
        if (cm) {
          onResolveConnection(tileId);
        } else if (e.ctrlKey || e.metaKey) {
          onSelectTile(tileId, true);
        } else {
          // Toggle off if it's the only selected tile
          const isOnlySelected = sel.length === 1 && sel[0] === tileId;
          onSelectTile(isOnlySelected ? null : tileId);
        }
      }
    },
    [onResolveConnection, onSelectTile],
  );

  // Click on empty canvas background
  const handleWorldPointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      // Only fires if event not stopped by a tile
      const local = e.getLocalPosition(e.currentTarget as Container);

      // Shift+drag starts marquee rectangle selection
      if (e.shiftKey) {
        rectSelectRef.current = {
          startX: local.x,
          startY: local.y,
          currentX: local.x,
          currentY: local.y,
        };
        return;
      }

      const { row, col } = localToGrid(local.x, local.y);
      const hit = tileAtGrid(row, col);
      if (!hit) {
        const { connectMode: cm, activePalette: ap } = stateRef.current;
        if (cm) {
          onCancelConnectMode();
        } else if (ap !== 'eraser') {
          onPlaceTile(row, col);
        } else {
          onSelectTile(null);
        }
      }
    },
    [localToGrid, tileAtGrid, onCancelConnectMode, onPlaceTile, onSelectTile],
  );

  // ── draw functions ─────────────────────────────────────────────────────────

  const drawGrid = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Full background
      g.rect(0, 0, WORLD_SIZE, WORLD_SIZE).fill({ color: C.gridBg });
      // Empty cells (all 169)
      const halfGap = TILE_GAP / 2;
      for (let r = 1; r <= gridRows; r++) {
        for (let c = 1; c <= gridCols; c++) {
          const x = (c - 1) * cellSize + halfGap;
          const y = (r - 1) * cellSize + halfGap;
          const w = cellSize - TILE_GAP;
          const h = cellSize - TILE_GAP;
          g.rect(x, y, w, h).fill({ color: C.emptyCell, alpha: 0.6 });
        }
      }
    },
    [cellSize, gridCols, gridRows],
  );

  const drawArrows = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const t of tiles) {
        if (!t.connectsTo) continue;
        const src = layoutMap.get(t.id);
        const dst = layoutMap.get(t.connectsTo);
        if (!src || !dst) continue;
        const color = selectedSet.has(t.id) ? C.arrowSelected : C.arrowNormal;
        drawArrow(g, src.cx, src.cy, dst.cx, dst.cy, color);
      }
    },
    [tiles, layoutMap, selectedSet],
  );

  const drawSelectionHighlight = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (selectedTileIds.length === 0) return;
      const pad = 3;
      if (connectMode && selectedTileIds.length === 1) {
        const layout = layoutMap.get(selectedTileIds[0]);
        if (layout) {
          g.rect(layout.x - pad, layout.y - pad, layout.w + pad * 2, layout.h + pad * 2)
            .stroke({ color: C.connectSrc, width: 3 });
        }
      } else {
        for (const id of selectedTileIds) {
          const layout = layoutMap.get(id);
          if (!layout) continue;
          g.rect(layout.x - pad, layout.y - pad, layout.w + pad * 2, layout.h + pad * 2)
            .stroke({ color: C.selected, width: 3 });
        }
      }
    },
    [selectedTileIds, layoutMap, connectMode],
  );

  const drawConnectOverlay = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!connectMode) return;
      for (const t of tiles) {
        if (selectedSet.has(t.id)) continue;
        const layout = layoutMap.get(t.id);
        if (!layout) continue;
        g.rect(layout.x, layout.y, layout.w, layout.h)
          .fill({ color: C.connectTarget, alpha: 0.25 });
      }
    },
    [connectMode, tiles, layoutMap, selectedSet],
  );

  return (
    <pixiContainer
      eventMode="static"
      onPointerDown={handleWorldPointerDown}
      onPointerMove={handleWorldPointerMove}
      onPointerUp={handleWorldPointerUp}
      width={WORLD_SIZE}
      height={WORLD_SIZE}
    >
      {/* Layer 1: grid background */}
      <pixiGraphics draw={drawGrid} />

      {/* Layer 2: connection arrows */}
      <pixiGraphics draw={drawArrows} />

      {/* Layer 3: tiles */}
      {tiles.map((tile) => {
        const layout = layoutMap.get(tile.id);
        if (!layout) return null;
        const { x, y, w, h, cx, cy } = layout;
        const color = tileColor(tile);
        const fontSize = Math.max(7, w * 0.14);
        const idFontSize = Math.max(6, w * 0.11);

        return (
          <pixiContainer
            key={tile.id}
            eventMode="static"
            cursor="pointer"
            onPointerDown={(e: FederatedPointerEvent) => handleTilePointerDown(e, tile.id)}
            onPointerUp={(e: FederatedPointerEvent) => handleTilePointerUp(e, tile.id)}
          >
            {/* Tile background */}
            <pixiGraphics
              draw={(g: PixiGraphics) => {
                g.clear();
                g.rect(x, y, w, h)
                  .fill({ color, alpha: 0.9 })
                  .stroke({ color: C.border, width: 1 });
              }}
            />
            {/* Tile type label */}
            <pixiText
              text={
                tile.type === 'shop' ? '🏪'
                : tile.type === 'corner' ? '🚩'
                : tile.type === 'modifier' ? '⭐'
                : tile.obstacleType === 'slip' ? '🧊'
                : tile.obstacleType === 'trap' ? '⚠️'
                : '◆'
              }
              x={cx}
              y={cy - fontSize * 0.5}
              anchor={{ x: 0.5, y: 0.5 }}
              style={{ fontFamily: 'Arial', fontSize, fill: C.tileText, align: 'center' }}
            />
            {/* Tile ID */}
            <pixiText
              text={tile.id}
              x={cx}
              y={cy + fontSize * 0.6}
              anchor={{ x: 0.5, y: 0 }}
              style={{
                fontFamily: 'monospace',
                fontSize: idFontSize,
                fill: C.idText,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: w - 2,
              }}
            />
            {/* connectsTo subtitle */}
            {tile.connectsTo && (
              <pixiText
                text={`→${tile.connectsTo}`}
                x={cx}
                y={cy + fontSize * 0.6 + idFontSize + 1}
                anchor={{ x: 0.5, y: 0 }}
                style={{
                  fontFamily: 'monospace',
                  fontSize: Math.max(5, idFontSize * 0.85),
                  fill: C.subtitleText,
                  align: 'center',
                  wordWrap: true,
                  wordWrapWidth: w - 2,
                }}
              />
            )}
          </pixiContainer>
        );
      })}

      {/* Layer 4: selection highlight + connect overlay */}
      <pixiGraphics draw={drawSelectionHighlight} eventMode="none" />
      <pixiGraphics draw={drawConnectOverlay} eventMode="none" />

      {/* Layer 5: drag ghost */}
      <pixiGraphics
        eventMode="none"
        ref={(g) => {
          if (g) ghostGfxRef.current = g as unknown as PixiGraphics;
        }}
      />

      {/* Layer 6: marquee rectangle (topmost) */}
      <pixiGraphics
        eventMode="none"
        ref={(g) => {
          if (g) rectGfxRef.current = g as unknown as PixiGraphics;
        }}
      />
    </pixiContainer>
  );
}

// ── outer component ───────────────────────────────────────────────────────────

interface WorldBuilderCanvasProps {
  editorState: EditorState;
  onPlaceTile: (row: number, col: number) => void;
  onSelectTile: (id: string | null, additive?: boolean) => void;
  onSelectTiles: (ids: string[]) => void;
  onMoveTile: (id: string, row: number, col: number) => void;
  onMoveSelectedTiles: (anchorId: string, newRow: number, newCol: number, offsets: GroupOffset[]) => void;
  onResolveConnection: (id: string) => void;
  onCancelConnectMode: () => void;
}

export default function WorldBuilderCanvas({
  editorState,
  onPlaceTile,
  onSelectTile,
  onSelectTiles,
  onMoveTile,
  onMoveSelectedTiles,
  onResolveConnection,
  onCancelConnectMode,
}: WorldBuilderCanvasProps) {
  return (
    <div
      className="w-full aspect-square"
      style={{ maxWidth: WORLD_SIZE }}
    >
      <Application
        width={WORLD_SIZE}
        height={WORLD_SIZE}
        background={C.gridBg}
        antialias
        autoDensity
        resolution={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1}
        className="!w-full !h-full block"
      >
        <WorldBuilderCanvasContent
          editorState={editorState}
          onPlaceTile={onPlaceTile}
          onSelectTile={onSelectTile}
          onSelectTiles={onSelectTiles}
          onMoveTile={onMoveTile}
          onMoveSelectedTiles={onMoveSelectedTiles}
          onResolveConnection={onResolveConnection}
          onCancelConnectMode={onCancelConnectMode}
          viewportSize={WORLD_SIZE}
        />
      </Application>
    </div>
  );
}
