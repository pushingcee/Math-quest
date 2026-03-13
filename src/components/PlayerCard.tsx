'use client';

import { Player } from '@/types/game';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
}

export default function PlayerCard({ player, isActive }: PlayerCardProps) {
  const { language } = useLanguage();
  return (
    <div
      className={`min-w-[120px] max-w-[250px] flex-1 rounded-xl border-3 p-2 text-center transition-all duration-300 sm:min-w-[150px] sm:p-5 ${isActive
          ? 'z-10 -translate-y-1 scale-105 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg shadow-purple-500/40 sm:-translate-y-2.5 sm:scale-110'
          : 'border-gray-300 bg-white'
        }`}
    >
      <div className="mb-0.5 flex items-center justify-center gap-2.5 sm:mb-1.5">
        <span
          className="inline-block h-5 w-5 rounded-full sm:h-7 sm:w-7"
          style={{ background: player.color }}
        />
      </div>
      <div className="my-1 text-sm font-bold text-black sm:my-2.5 sm:text-xl">{player.name}</div>
      <div className="text-xs sm:text-sm">
        <div className="my-0.5 text-lg font-bold text-purple-600 sm:my-1 sm:text-2xl">
          {player.score} {t(language, 'points')}
        </div>
        <div className="text-xs font-medium text-black sm:text-sm">Tile {player.position + 1}</div>
      </div>
    </div>
  );
}
