'use client';

import { useRef, useCallback, useMemo } from 'react';
import { Application, extend } from '@pixi/react';
import {
  Container,
  Graphics as PixiGraphics,
  Text as PixiText,
  FederatedPointerEvent,
} from 'pixi.js';
import { EditorState, EditorTile, DragState } from './worldBuilderTypes';
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

interface CanvasContentProps {
  editorState: EditorState;
  onPlaceTile: (row: number, col: number) => void;
  onSelectTile: (id: string | null) => void;
  onMoveTile: (id: string, row: number, col: number) => void;
  onResolveConnection: (id: string) => void;
  onCancelConnectMode: () => void;
  viewportSize: number;
}

function WorldBuilderCanvasContent({
  editorState,
  onPlaceTile,
  onSelectTile,
  onMoveTile,
  onResolveConnection,
  onCancelConnectMode,
  viewportSize,
}: CanvasContentProps) {
  const { tiles, selectedTileId, connectMode, activePalette, gridCols, gridRows } = editorState;

  const dragRef = useRef<DragState | null>(null);
  const ghostGfxRef = useRef<PixiGraphics | null>(null);
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
      const tileId = dragRef.current.tileId;
      const tile = tiles.find((t) => t.id === tileId);
      if (!tile) return;
      const halfGap = TILE_GAP / 2;
      const size = cellSize * tile.span - TILE_GAP;
      const snapCol = Math.floor(localX / cellSize);
      const snapRow = Math.floor(localY / cellSize);
      const gx = snapCol * cellSize + halfGap;
      const gy = snapRow * cellSize + halfGap;
      g.rect(gx, gy, size, size)
        .fill({ color: C.ghost, alpha: 0.55 })
        .stroke({ color: C.ghost, width: 2 });
    },
    [tiles, cellSize],
  );

  // ── pointer handlers on world container ───────────────────────────────────

  const handleWorldPointerMove = useCallback(
    (e: FederatedPointerEvent) => {
      if (!dragRef.current) return;
      const local = e.getLocalPosition(e.currentTarget as Container);
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
      if (!dragRef.current) return;
      const drag = dragRef.current;
      dragRef.current = null;

      // Clear ghost
      if (ghostGfxRef.current) ghostGfxRef.current.clear();

      const local = e.getLocalPosition(e.currentTarget as Container);
      const { row, col } = localToGrid(local.x, local.y);

      if (drag.isDragging) {
        onMoveTile(drag.tileId, row, col);
      }
      // Click (no drag) is handled in the tile's own pointerup
    },
    [localToGrid, onMoveTile],
  );

  // ── pointer handlers per tile ─────────────────────────────────────────────

  const handleTilePointerDown = useCallback(
    (e: FederatedPointerEvent, tileId: string) => {
      e.stopPropagation();
      dragRef.current = {
        tileId,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false,
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
        // Tap = select or connect
        if (connectMode) {
          onResolveConnection(tileId);
        } else {
          onSelectTile(tileId === selectedTileId ? null : tileId);
        }
      }
    },
    [connectMode, selectedTileId, onResolveConnection, onSelectTile],
  );

  // Click on empty canvas background
  const handleWorldPointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      // Only fires if event not stopped by a tile
      const local = e.getLocalPosition(e.currentTarget as Container);
      const { row, col } = localToGrid(local.x, local.y);
      const hit = tileAtGrid(row, col);
      if (!hit) {
        if (connectMode) {
          onCancelConnectMode();
        } else if (activePalette !== 'eraser') {
          onPlaceTile(row, col);
        } else {
          onSelectTile(null);
        }
      }
    },
    [localToGrid, tileAtGrid, connectMode, activePalette, onCancelConnectMode, onPlaceTile, onSelectTile],
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
        const isSelected = t.id === selectedTileId;
        const color = isSelected ? C.arrowSelected : C.arrowNormal;
        drawArrow(g, src.cx, src.cy, dst.cx, dst.cy, color);
      }
    },
    [tiles, layoutMap, selectedTileId],
  );

  const drawSelectionHighlight = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!selectedTileId) return;
      const layout = layoutMap.get(selectedTileId);
      if (!layout) return;
      const pad = 3;
      if (connectMode) {
        // Source tile: green ring
        g.rect(layout.x - pad, layout.y - pad, layout.w + pad * 2, layout.h + pad * 2)
          .stroke({ color: C.connectSrc, width: 3 });
      } else {
        // Normal selection: sky ring
        g.rect(layout.x - pad, layout.y - pad, layout.w + pad * 2, layout.h + pad * 2)
          .stroke({ color: C.selected, width: 3 });
      }
    },
    [selectedTileId, layoutMap, connectMode],
  );

  const drawConnectOverlay = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!connectMode) return;
      // Cyan tint over all non-source tiles
      for (const t of tiles) {
        if (t.id === selectedTileId) continue;
        const layout = layoutMap.get(t.id);
        if (!layout) continue;
        g.rect(layout.x, layout.y, layout.w, layout.h)
          .fill({ color: C.connectTarget, alpha: 0.25 });
      }
    },
    [connectMode, tiles, layoutMap, selectedTileId],
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
      <pixiGraphics draw={drawSelectionHighlight} />
      <pixiGraphics draw={drawConnectOverlay} />

      {/* Layer 5: drag ghost (topmost) */}
      <pixiGraphics
        ref={(g) => {
          if (g) ghostGfxRef.current = g as unknown as PixiGraphics;
        }}
      />
    </pixiContainer>
  );
}

// ── outer component ───────────────────────────────────────────────────────────

interface WorldBuilderCanvasProps {
  editorState: EditorState;
  onPlaceTile: (row: number, col: number) => void;
  onSelectTile: (id: string | null) => void;
  onMoveTile: (id: string, row: number, col: number) => void;
  onResolveConnection: (id: string) => void;
  onCancelConnectMode: () => void;
}

export default function WorldBuilderCanvas({
  editorState,
  onPlaceTile,
  onSelectTile,
  onMoveTile,
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
          onMoveTile={onMoveTile}
          onResolveConnection={onResolveConnection}
          onCancelConnectMode={onCancelConnectMode}
          viewportSize={WORLD_SIZE}
        />
      </Application>
    </div>
  );
}
