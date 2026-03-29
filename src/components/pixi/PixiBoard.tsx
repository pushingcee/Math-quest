'use client';

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics as PixiGraphics, Sprite as PixiSprite, Text as PixiText, Texture, Assets, Ticker } from 'pixi.js';
import { TileData, Player } from '@/types/game';
import { TILE_GAP } from '@/game/board/BoardLayout';
import { BoardGraph } from '@/game/board/BoardGraph';
import { BoardConfig } from '@/game/board/BoardConfig';
import { BoardConfigLoader } from '@/game/board/BoardConfigLoader';
import defaultBoardJson from '@/game/board/boards/default.board.json';

const defaultBoard = BoardConfigLoader.parse(defaultBoardJson);
import { useCamera } from './useCamera';
import PixiTile from './PixiTile';
import PixiPlayerToken from './PixiPlayerToken';
import { assetPath } from '@/utils/assetPath';

extend({ Container, Graphics: PixiGraphics, Sprite: PixiSprite, Text: PixiText });

let bgTexturePromise: Promise<Texture> | null = null;
function loadBgTexture(): Promise<Texture> {
  if (!bgTexturePromise) {
    bgTexturePromise = Assets.load(assetPath('/generic-bg.jpg'));
  }
  return bgTexturePromise;
}

interface PixiBoardProps {
  tiles: TileData[];
  players: Player[];
  currentPlayer: number;
  movingPlayer: number | null;
  teleporterMode?: boolean;
  selectedTeleportTile?: number | null;
  onTileTeleportClick?: (index: number) => void;
  maxHeight?: number;
  boardConfig?: BoardConfig;
}

const BOARD_BG = 0x334155; // slate-700
const TILE_GAP_COLOR = 0x6b7280; // gray-500 — visible in the gaps between tiles
const BOARD_PADDING = 0;
const BOARD_WORLD_SIZE = 863; // fixed world size — 750 * 1.15 (scaled up 15%)

function FpsCounter({ x, y }: { x: number; y: number }) {
  const { app } = useApplication();
  const textRef = useRef<PixiText>(null);

  useEffect(() => {
    const ticker = app?.ticker;
    if (!ticker) return;
    let frames = 0;
    let elapsed = 0;
    const tick = (t: Ticker) => {
      frames++;
      elapsed += t.deltaMS;
      if (elapsed >= 500) {
        const fps = Math.round((frames / elapsed) * 1000);
        if (textRef.current) textRef.current.text = `${fps} FPS`;
        frames = 0;
        elapsed = 0;
      }
    };
    ticker.add(tick);
    return () => { ticker.remove(tick); };
  }, [app?.ticker]);

  return (
    <pixiText
      ref={textRef}
      text="-- FPS"
      x={x}
      y={y}
      anchor={{ x: 1, y: 1 }}
      style={{ fontFamily: 'monospace', fontSize: 14, fill: 0x00ff00, fontWeight: 'bold' }}
    />
  );
}

/** Inner component that has access to the PixiJS application context */
function PixiBoardContent({
  tiles,
  players,
  currentPlayer,
  movingPlayer,
  teleporterMode,
  selectedTeleportTile,
  onTileTeleportClick,
  boardConfig,
  viewportWidth,
  viewportHeight,
}: PixiBoardProps & { viewportWidth: number; viewportHeight: number }) {
  const { app } = useApplication();
  const worldRef = useRef<Container>(null);

  // Allow browser pinch-zoom on the canvas.
  // PixiJS sets canvas.style.touchAction = 'none' inline during init,
  // which overrides our CSS class — so we must override it back here.
  // Also disable autoPreventDefault so PixiJS doesn't call preventDefault()
  // on pointer events, which would cancel the browser's zoom gesture.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (app?.canvas) {
        (app.canvas as HTMLCanvasElement).style.touchAction = 'manipulation';
      }
      if (app?.renderer?.events) {
        (app.renderer.events as unknown as { autoPreventDefault: boolean }).autoPreventDefault = false;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [app]);

  // Load inner board background texture
  const [bgTexture, setBgTexture] = useState<Texture | null>(null);
  useEffect(() => { loadBgTexture().then(setBgTexture); }, []);

  // Board graph: doubly-linked tile structure with layout + pawn slots
  const innerSize = BOARD_WORLD_SIZE - BOARD_PADDING * 2;
  const config = boardConfig ?? defaultBoard;
  const boardGraph = useMemo(
    () => BoardGraph.fromLayout(innerSize, tiles, config),
    [innerSize, tiles, config]
  );

  // Sync pawn slots whenever players move
  useMemo(() => {
    boardGraph.syncSlotsFromPlayers(players);
  }, [boardGraph, players]);

  // Derived layout values for rendering (shadows, gap bg, background image)
  const layout = useMemo(() => {
    const allTiles = boardGraph.getAllTiles();
    const gridMax = Math.max(config.gridCols, config.gridRows);
    const cellSize = innerSize / gridMax;
    return {
      tiles: allTiles.map((t) => t.layout),
      modifiers: boardGraph.getModifiers(),
      cellSize,
    };
  }, [boardGraph, innerSize, config]);

  // Find the active player's world-space position for the camera
  const activePlayer = players[currentPlayer];
  const cameraTarget = useMemo(() => {
    if (!activePlayer) return null;
    const tileNode = boardGraph.getTileByIndex(activePlayer.position);
    if (!tileNode) return null;
    return {
      x: tileNode.layout.centerX + BOARD_PADDING,
      y: tileNode.layout.centerY + BOARD_PADDING,
    };
  }, [activePlayer?.position, boardGraph]);

  // Drop shadows — single Graphics layer, zero GPU filter cost
  const drawTileShadows = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const tl of layout.tiles) {
        g.roundRect(tl.x + 3, tl.y + 3, tl.width, tl.height, 2)
          .fill({ color: 0x000000, alpha: 0.55 });
      }
    },
    [layout]
  );

  // Draw gray background behind each tile's full cell area so the gaps are visibly gray
  const drawGapBackground = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const halfGap = TILE_GAP / 2;
      for (const tl of layout.tiles) {
        // Expand tile rect back to the full cell size (undo the gap inset)
        g.rect(tl.x - halfGap, tl.y - halfGap, tl.width + TILE_GAP, tl.height + TILE_GAP)
          .fill({ color: TILE_GAP_COLOR });
      }
    },
    [layout]
  );

  // Modifier overlays — semi-transparent gold rectangles with label text
  const drawModifierOverlays = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const mod of layout.modifiers) {
        g.rect(mod.x, mod.y, mod.width, mod.height)
          .fill({ color: 0xfbbf24, alpha: 0.5 });
      }
    },
    [layout.modifiers]
  );

  // Camera: smoothly pans/zooms the world container
  useCamera(worldRef, cameraTarget, {
    viewportWidth,
    viewportHeight,
    worldSize: BOARD_WORLD_SIZE,
    ticker: app?.ticker ?? null,
  });

  return (<>
    <pixiContainer ref={worldRef}>

      {/* Inner board background image (fills area inside the perimeter tiles) */}
      {/* Full-canvas background image — base layer behind everything */}
      {bgTexture && (
        <pixiSprite
          texture={bgTexture}
          x={0}
          y={0}
          width={BOARD_WORLD_SIZE}
          height={BOARD_WORLD_SIZE}
        />
      )}

      {/* Gray gap background behind tiles */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING}>
        <pixiGraphics draw={drawGapBackground} />
      </pixiContainer>

      {/* Drop shadows — between gap background and tiles */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING}>
        <pixiGraphics draw={drawTileShadows} />
      </pixiContainer>

      {/* Tiles layer */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING} sortableChildren>
        {tiles.map((tile) => {
          const tileNode = boardGraph.getTileByIndex(tile.index);
          if (!tileNode) return null;
          return (
            <PixiTile
              key={tile.index}
              tile={tile}
              layout={tileNode.layout}
              teleporterMode={teleporterMode}
              teleporterSelected={selectedTeleportTile === tile.index}
              onTeleportClick={onTileTeleportClick}
            />
          );
        })}
      </pixiContainer>

      {/* Modifier overlays — rendered above tiles */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING}>
        <pixiGraphics draw={drawModifierOverlays} />
        {layout.modifiers.map((mod) => {
          const labelText = (mod.label || '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '');
          return labelText ? (
            <pixiText
              key={mod.id}
              text={labelText}
              x={mod.centerX}
              y={mod.centerY}
              anchor={{ x: 0.5, y: 0.5 }}
              style={{
                fontFamily: 'Arial',
                fontSize: Math.max(8, mod.width * 0.12),
                fill: 0xffffff,
                fontWeight: 'bold',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: mod.width - 4,
              }}
            />
          ) : null;
        })}
      </pixiContainer>

      {/* Players layer */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING} sortableChildren>
        {players.map((player) => {
          const tileNode = boardGraph.getTileByIndex(player.position);
          if (!tileNode) return null;
          const slotOffset = boardGraph.getPlayerSlotOffset(player.position, player.id);
          return (
            <PixiPlayerToken
              key={player.id}
              player={player}
              tileLayout={tileNode.layout}
              slotOffset={slotOffset}
              isMoving={movingPlayer === player.id}
              isActive={player.id === currentPlayer}
              teleporterMode={teleporterMode}
            />
          );
        })}
      </pixiContainer>
    </pixiContainer>

    {/* FPS counter — dev only */}
    {process.env.NODE_ENV === 'development' && (
      <FpsCounter x={viewportWidth - 8} y={viewportHeight - 8} />
    )}
  </>
  );
}

export default function PixiBoard(props: PixiBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // Measure the container for the viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const width = container.clientWidth;
      // Viewport is square — constrained by width, maxHeight, and max world size
      const constraints = [width, BOARD_WORLD_SIZE];
      if (props.maxHeight && props.maxHeight > 0) {
        constraints.push(props.maxHeight);
      }
      const size = Math.min(...constraints);
      setViewport({ width: size, height: size });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [props.maxHeight]);

  if (viewport.width === 0) {
    return (
      <div
        ref={containerRef}
        className="mx-auto aspect-square w-full max-w-[863px]"
        id="board"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-[863px]"
      id="board"
      style={{
        perspective: '800px',
        perspectiveOrigin: '50% 40%',
        padding: '24px 0',
      }}
    >
      <div
        style={{
          height: viewport.height,
          overflow: 'hidden',
          touchAction: 'manipulation',
          outline: '3px solid rgba(180, 140, 60, 0.9)',
          boxShadow:
            'inset 0 1px 0 rgba(255,220,100,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 60px 20px rgba(0,0,0,0.8), 0 0 140px 50px rgba(0,0,0,0.6), 0 20px 80px 30px rgba(0,0,0,0.9)',
          transform: 'rotateX(6deg)',
          transformStyle: 'preserve-3d' as const,
        }}
      >
        <Application
          width={viewport.width}
          height={viewport.height}
          backgroundAlpha={0}
          antialias={typeof window !== 'undefined' && window.devicePixelRatio <= 1.5}
          autoDensity
          resolution={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1}
          className="!h-full !w-full block [touch-action:manipulation]"
        >
          <PixiBoardContent
            {...props}
            viewportWidth={viewport.width}
            viewportHeight={viewport.height}
          />
        </Application>
      </div>
    </div>
  );
}
