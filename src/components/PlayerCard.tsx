'use client';

import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: PlayerCardProps) {
  return (
    <div
      className={`min-w-[150px] max-w-[250px] flex-1 rounded-xl border-3 p-5 text-center transition-all duration-300 ${
        isActive
          ? 'z-10 -translate-y-2.5 scale-110 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-500/40'
          : 'border-gray-300 bg-white'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-center gap-2.5">
        <span
          className="inline-block h-7 w-7 rounded-full"
          style={{ background: player.color }}
        />
      </div>
      <div className="my-2.5 text-xl font-bold text-black">{player.name}</div>
      <div className="text-sm">
        <div className="my-1 text-2xl font-bold text-purple-600">
          {player.score} pts
        </div>
        <div className="text-sm font-medium text-black">Tile {player.position + 1}</div>
      </div>
    </div>
  );
}
