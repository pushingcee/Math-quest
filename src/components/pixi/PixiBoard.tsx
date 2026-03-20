'use client';

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics as PixiGraphics, Sprite as PixiSprite, Text as PixiText, Texture, Assets } from 'pixi.js';
import { TileData, Player } from '@/types/game';
import { computeBoardLayout, computeStackOffset, TILE_GAP } from '@/game/board/BoardLayout';
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
    const tick = () => {
      frames++;
      elapsed += ticker.deltaMS;
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

  // Layout is always computed at the fixed world size
  const innerSize = BOARD_WORLD_SIZE - BOARD_PADDING * 2;
  const layout = useMemo(() => computeBoardLayout(innerSize), [innerSize]);

  // Find the active player's world-space position for the camera
  const activePlayer = players[currentPlayer];
  const cameraTarget = useMemo(() => {
    if (!activePlayer) return null;
    const tileLayout = layout.tiles[activePlayer.position];
    if (!tileLayout) return null;
    return {
      x: tileLayout.centerX + BOARD_PADDING,
      y: tileLayout.centerY + BOARD_PADDING,
    };
  }, [activePlayer?.position, layout]);

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

  // Camera: smoothly pans/zooms the world container
  useCamera(worldRef, cameraTarget, {
    viewportWidth,
    viewportHeight,
    worldSize: BOARD_WORLD_SIZE,
    ticker: app?.ticker ?? null,
  });

  return (<>
    <pixiContainer ref={worldRef}>

      {/* Inner board background image */}
      {bgTexture && (
        <pixiSprite
          texture={bgTexture}
          x={BOARD_PADDING + layout.cellSize}
          y={BOARD_PADDING + layout.cellSize}
          width={layout.cellSize * 9}
          height={layout.cellSize * 9}
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
          const tileLayout = layout.tiles[tile.index];
          if (!tileLayout) return null;
          return (
            <PixiTile
              key={tile.index}
              tile={tile}
              layout={tileLayout}
              teleporterMode={teleporterMode}
              teleporterSelected={selectedTeleportTile === tile.index}
              onTeleportClick={onTileTeleportClick}
            />
          );
        })}
      </pixiContainer>

      {/* Players layer */}
      <pixiContainer x={BOARD_PADDING} y={BOARD_PADDING} sortableChildren>
        {players.map((player) => {
          const tileLayout = layout.tiles[player.position];
          if (!tileLayout) return null;
          const offset = computeStackOffset(player.id, player.position, players);
          return (
            <PixiPlayerToken
              key={player.id}
              player={player}
              tileLayout={tileLayout}
              stackOffset={offset}
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
      className="mx-auto w-full max-w-[863px] overflow-hidden"
      id="board"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 40%',
      }}
    >
      <div
        style={{
          height: viewport.height,
          touchAction: 'manipulation',
          outline: '3px solid rgba(180, 140, 60, 0.9)',
          boxShadow:
            'inset 0 1px 0 rgba(255,220,100,0.4), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 60px 20px rgba(0,0,0,0.8), 0 0 140px 50px rgba(0,0,0,0.6), 0 20px 80px 30px rgba(0,0,0,0.9)',
          transform: 'rotateX(3deg)',
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
