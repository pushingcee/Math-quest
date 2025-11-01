'use client';

import { Player } from '@/types/game';
import { playerSprites } from './PlayerSprites';

interface PlayerTokenProps {
  player: Player;
  left: number;
  top: number;
  isMoving?: boolean;
  isActive?: boolean;
}

export default function PlayerToken({ player, left, top, isMoving, isActive }: PlayerTokenProps) {
  return (
    <div
      id={`player-${player.id}`}
      className="absolute z-50 transition-all duration-300 ease-out"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      {/* Active player indicator ellipse */}
      {isActive && (
        <div
          className="absolute left-1/2 top-1/2 -z-10 h-7.5 w-11.25 rounded-full animate-highlight-grow"
          style={{
            backgroundColor: player.color,
            opacity: 0.9,
            filter: 'blur(2px)',
            transform: 'translate(-50%, -50%) translateY(2em)',
          }}
        />
      )}

      {/* Player avatar */}
      <div
        className="relative h-16 w-16"
        style={{
          filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
        }}
      >
        <div
          className={`relative h-full w-full ${isMoving ? 'animate-bounce-token' : 'animate-idle'}`}
          style={{
            imageRendering: 'pixelated',
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: playerSprites[player.id] }}
        />
      </div>
    </div>
  );
}
