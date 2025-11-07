'use client';

import { useEffect, useRef } from 'react';
import { TileData } from '@/types/game';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';
import { convertMathToLatex } from '@/utils/mathToLatex';

interface BoardProps {
  tiles: TileData[];
  children?: React.ReactNode;
  displayProblemsInTiles?: boolean;
}

export default function Board({ tiles, children, displayProblemsInTiles = true }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boardRef}
      id="board"
      className="relative mx-auto grid aspect-square w-full grid-cols-11 grid-rows-11 gap-0 rounded-xl bg-slate-700 p-2 auto-rows-fr auto-cols-fr"
    >
      {tiles.map((tile) => (
        <Tile key={tile.index} tile={tile} displayProblem={displayProblemsInTiles} />
      ))}
      {children}
    </div>
  );
}

function Tile({ tile, displayProblem = true }: { tile: TileData; displayProblem?: boolean }) {
  const { index, difficulty, points, type, label, question } = tile;
  const mathRef = useRef<HTMLDivElement>(null);

  // Render math with KaTeX
  useEffect(() => {
    if (mathRef.current && question && displayProblem) {
      const latexExpression = convertMathToLatex(question);
      const displayText = `$${latexExpression}$`;
      mathRef.current.textContent = displayText;

      try {
        renderMathInElement(mathRef.current, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
          ],
          throwOnError: false,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
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

  if (type === 'corner') {
    return (
      <div
        data-index={index}
        style={position}
        className="flex flex-col items-center justify-center rounded-sm bg-gradient-to-br from-pink-400 to-rose-500 p-4 text-center text-xs font-bold text-white transition-all hover:z-10 hover:scale-105 hover:shadow-lg sm:text-sm"
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
      className="relative flex cursor-pointer flex-col items-center justify-center border border-slate-600 bg-white p-2 text-center text-xs transition-all hover:z-10 hover:scale-105 hover:shadow-lg"
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
