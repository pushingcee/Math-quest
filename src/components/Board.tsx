'use client';

import { useEffect, useRef, useState } from 'react';
import { TileData } from '@/types/game';

interface BoardProps {
  tiles: TileData[];
  children?: React.ReactNode;
}

export default function Board({ tiles, children }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      id="board"
      className="relative mx-auto grid aspect-square max-w-[750px] grid-cols-11 grid-rows-11 gap-0.5 rounded-xl bg-slate-700 p-0.5"
    >
      {tiles.map((tile) => (
        <Tile key={tile.index} tile={tile} />
      ))}
      {children}
    </div>
  );
}

function Tile({ tile }: { tile: TileData }) {
  const { index, difficulty, points, type, label } = tile;

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

  if (type === 'corner') {
    return (
      <div
        data-index={index}
        style={position}
        className="flex flex-col items-center justify-center rounded-sm bg-gradient-to-br from-pink-400 to-rose-500 p-1.5 text-center text-xs font-bold text-white transition-all hover:z-10 hover:scale-105 hover:shadow-lg sm:text-sm"
        dangerouslySetInnerHTML={{ __html: label || '' }}
      />
    );
  }

  return (
    <div
      data-index={index}
      data-difficulty={difficulty}
      data-points={points}
      style={position}
      className="relative flex cursor-pointer flex-col items-center justify-center border border-slate-600 bg-white p-1 text-center text-xs transition-all hover:z-10 hover:scale-105 hover:shadow-lg"
    >
      <div className="text-[0.65rem] text-black sm:text-xs">Math {difficulty}</div>
      <div className="mt-0.5 text-[0.65rem] font-bold text-black sm:text-xs">
        {points}pts
      </div>
    </div>
  );
}
