'use client';

import { Player } from '@/types/game';
import { playerSprites } from './PlayerSprites';

interface PlayerTokenProps {
  player: Player;
  left: number;
  top: number;
  isMoving?: boolean;
}

export default function PlayerToken({ player, left, top, isMoving }: PlayerTokenProps) {
  return (
    <div
      id={`player-${player.id}`}
      className="absolute z-50 h-16 w-16 transition-all duration-300 ease-out"
      style={{
        left: `${left}px`,
        top: `${top}px`,
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
  );
}
