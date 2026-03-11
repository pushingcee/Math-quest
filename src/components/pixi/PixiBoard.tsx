'use client';

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics as PixiGraphics } from 'pixi.js';
import { TileData, Player } from '@/types/game';
import { computeBoardLayout, computeStackOffset } from '@/game/board/BoardLayout';
import { useCamera } from './useCamera';
import PixiTile from './PixiTile';
import PixiPlayerToken from './PixiPlayerToken';

extend({ Container, Graphics: PixiGraphics });

interface PixiBoardProps {
  tiles: TileData[];
  players: Player[];
  currentPlayer: number;
  movingPlayer: number | null;
  teleporterMode?: boolean;
  selectedTeleportTile?: number | null;
  onTileTeleportClick?: (index: number) => void;
}

const BOARD_BG = 0x334155; // slate-700
const BOARD_PADDING = 8;
const BOARD_WORLD_SIZE = 750; // fixed world size — board is always rendered at this size

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

  // Camera: smoothly pans/zooms the world container
  useCamera(worldRef, cameraTarget, {
    viewportWidth,
    viewportHeight,
    worldSize: BOARD_WORLD_SIZE,
    ticker: app?.ticker ?? null,
  });

  const drawBackground = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, BOARD_WORLD_SIZE, BOARD_WORLD_SIZE, 12).fill(BOARD_BG);
    },
    []
  );

  return (
    <pixiContainer ref={worldRef}>
      {/* Board background */}
      <pixiGraphics draw={drawBackground} />

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
            />
          );
        })}
      </pixiContainer>
    </pixiContainer>
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
      // Viewport is square, sized to the container width (capped at board size)
      const size = Math.min(width, BOARD_WORLD_SIZE);
      setViewport({ width: size, height: size });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (viewport.width === 0) {
    return (
      <div
        ref={containerRef}
        className="mx-auto aspect-square w-full max-w-[750px]"
        id="board"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-[750px]"
      id="board"
      style={{ height: viewport.height }}
    >
      <Application
        width={viewport.width}
        height={viewport.height}
        background={BOARD_BG}
        antialias
        autoDensity
        resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
        className="block rounded-xl"
      >
        <PixiBoardContent
          {...props}
          viewportWidth={viewport.width}
          viewportHeight={viewport.height}
        />
      </Application>
    </div>
  );
}
