'use client';

import { useEffect, useRef } from 'react';
import { TileData } from '@/types/game';
import { TileType, ObstacleType } from '@/game/constants/enums';
import { MathRenderer } from '@jahnchock/math-to-latex';
import 'katex/dist/katex.min.css';

interface BoardProps {
  tiles: TileData[];
  children?: React.ReactNode;
  displayProblemsInTiles?: boolean;
  teleporterMode?: boolean;
  onTileTeleportClick?: (tileIndex: number) => void;
}

export default function Board({
  tiles,
  children,
  displayProblemsInTiles = true,
  teleporterMode = false,
  onTileTeleportClick
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      id="board"
      className="relative mx-auto grid aspect-square w-full grid-cols-11 grid-rows-11 gap-0 rounded-xl bg-slate-700 p-2 auto-rows-fr auto-cols-fr"
    >
      {tiles.map((tile) => (
        <Tile
          key={tile.index}
          tile={tile}
          displayProblem={displayProblemsInTiles}
          teleporterMode={teleporterMode}
          onTeleportClick={onTileTeleportClick}
        />
      ))}
      {children}
    </div>
  );
}

function Tile({
  tile,
  displayProblem = true,
  teleporterMode = false,
  onTeleportClick
}: {
  tile: TileData;
  displayProblem?: boolean;
  teleporterMode?: boolean;
  onTeleportClick?: (tileIndex: number) => void;
}) {
  const { index, difficulty, points, type, label, question } = tile;
  const mathRef = useRef<HTMLDivElement>(null);

  // Render math with MathRenderer
  useEffect(() => {
    if (mathRef.current && question && displayProblem) {
      try {
        const renderedHtml = MathRenderer.render(question);
        mathRef.current.innerHTML = renderedHtml;
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        mathRef.current.textContent = question;
      }
    }
  }, [question, displayProblem]);

  const getGridPosition = () => {
    if (index === 0) {
      return { gridColumn: '10 / span 2', gridRow: '10 / span 2' };
    } else if (index === 10) {
      return { gridColumn: '1 / span 2', gridRow: '10 / span 2' };
    } else if (index === 20) {
      return { gridColumn: '1 / span 2', gridRow: '1 / span 2' };
    } else if (index === 30) {
      return { gridColumn: '10 / span 2', gridRow: '1 / span 2' };
    } else {
      let col, row;
      if (index < 10) {
        // Bottom row
        col = 10 - index;
        row = 11;
      } else if (index < 20) {
        // Left column
        col = 1;
        row = 11 - (index - 10);
      } else if (index < 30) {
        // Top row
        col = index - 20 + 1;
        row = 1;
      } else {
        // Right column
        col = 11;
        row = index - 30 + 1;
      }
      return { gridColumn: col, gridRow: row };
    }
  };

  const position = getGridPosition();

  if (type === TileType.Corner) {
    return (
      <div
        data-index={index}
        style={{
          ...position,
          zIndex: 20,
        }}
        className={`flex flex-col items-center justify-center rounded-sm bg-gradient-to-br from-pink-400 to-rose-500 p-4 text-center text-xs font-bold text-white transition-all opacity-30 hover:z-30 hover:scale-105 hover:shadow-lg sm:text-sm ${
          teleporterMode ? 'cursor-pointer opacity-50 hover:opacity-100' : ''
        }`}
        onClick={() => teleporterMode && onTeleportClick?.(index)}
        dangerouslySetInnerHTML={{ __html: label || '' }}
      />
    );
  }

  // Handle shop tiles
  if (type === TileType.Shop) {
    return (
      <div
        data-index={index}
        style={position}
        className={`flex flex-col items-center justify-center border border-slate-600 bg-gradient-to-br from-yellow-200 to-yellow-400 p-2 text-center transition-all hover:z-10 hover:scale-105 hover:shadow-lg ${
          teleporterMode ? 'cursor-pointer' : ''
        }`}
        onClick={() => teleporterMode && onTeleportClick?.(index)}
      >
        <div className="text-2xl">🏪</div>
        <div className="text-xs font-bold text-purple-700">SHOP</div>
      </div>
    );
  }

  // Handle obstacle tiles
  if (type === TileType.Obstacle) {
    const isSlip = tile.obstacleType === ObstacleType.Slip;
    const bgColor = isSlip ? 'bg-blue-100' : 'bg-red-100';
    const emoji = isSlip ? '🧊' : '⚠️';

    return (
      <div
        data-index={index}
        style={position}
        className={`flex flex-col items-center justify-center border border-slate-600 ${bgColor} p-2 text-center text-2xl transition-all hover:z-10 hover:scale-105 hover:shadow-lg ${
          teleporterMode ? 'cursor-pointer' : ''
        }`}
        onClick={() => teleporterMode && onTeleportClick?.(index)}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      data-index={index}
      data-difficulty={difficulty}
      data-points={points}
      style={position}
      className="relative flex cursor-pointer flex-col items-center justify-center border border-slate-600 bg-white p-2 text-center text-xs transition-all hover:z-10 hover:scale-105 hover:shadow-lg"
      onClick={() => teleporterMode && onTeleportClick?.(index)}
    >
      <div ref={mathRef} className="text-[0.6rem] text-black sm:text-xs leading-tight">
        {displayProblem ? question : '?'}
      </div>
      <div className="mt-0.5 text-[0.55rem] font-bold text-purple-600 sm:text-[0.65rem]">
        {points}pts
      </div>
    </div>
  );
}
