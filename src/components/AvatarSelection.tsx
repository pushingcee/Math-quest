'use client';

import { useState } from 'react';
import { playerSprites } from './PlayerSprites';
import { colorizePlayerSprite } from '@/game/utils/svgColorizer';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface AvatarSelectionProps {
  playerNumber: number;
  selectedAvatars: number[];
  selectedColors: string[];
  onSelectAvatar: (avatarIndex: number, color: string) => void;
}

const AVAILABLE_COLORS = [
  { nameKey: 'red', hex: '#e74c3c' },
  { nameKey: 'blue', hex: '#3498db' },
  { nameKey: 'green', hex: '#2ecc71' },
  { nameKey: 'orange', hex: '#f39c12' },
  { nameKey: 'purple', hex: '#9b59b6' },
  { nameKey: 'pink', hex: '#e91e63' },
  { nameKey: 'teal', hex: '#1abc9c' },
  { nameKey: 'yellow', hex: '#f1c40f' },
] as const;

export default function AvatarSelection({
  playerNumber,
  selectedAvatars,
  selectedColors,
  onSelectAvatar,
}: AvatarSelectionProps) {
  const { language } = useLanguage();
  const avatarNameKeys = ['knight', 'wizard', 'archer', 'rogue', 'jester'] as const;
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleAvatarClick = (index: number) => {
    if (!selectedAvatars.includes(index)) {
      setSelectedAvatarIndex(index);

      // Set default color based on avatar
      const defaultColors = [
        '#e74c3c', // Knight → Red
        '#3498db', // Wizard → Blue
        '#2ecc71', // Archer → Green
        '#f39c12', // Rogue → Orange
        '#9b59b6', // Jester → Purple
      ];

      const defaultColor = defaultColors[index];
      // Only set default if that color isn't taken
      if (!selectedColors.includes(defaultColor)) {
        setSelectedColor(defaultColor);
      } else {
        // If default is taken, find first available color
        const availableColor = AVAILABLE_COLORS.find(c => !selectedColors.includes(c.hex));
        setSelectedColor(availableColor?.hex || null);
      }
    }
  };

  const handleColorClick = (color: string) => {
    if (!selectedColors.includes(color)) {
      setSelectedColor(color);
    }
  };

  const handleConfirm = () => {
    if (selectedAvatarIndex !== null && selectedColor !== null) {
      onSelectAvatar(selectedAvatarIndex, selectedColor);
    }
  };

  // Get sprite with color applied if this avatar is selected and has a color
  const getSpriteForDisplay = (index: number) => {
    if (index === selectedAvatarIndex && selectedColor !== null) {
      return colorizePlayerSprite(index, playerSprites[index], selectedColor);
    }
    return playerSprites[index];
  };

  return (
    <div className="text-center">
      <h2 className="mb-6 text-3xl font-bold"
        style={{ fontFamily: 'var(--font-libre-baskerville), Georgia, serif', color: 'var(--ed-text, #2c2825)', letterSpacing: '-0.02em' }}
      >
        {t(language, 'playerChooseCharacter', { number: playerNumber })}
      </h2>

      {/* Avatar Selection */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">{t(language, 'selectYourClass')}</h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {playerSprites.map((sprite, index) => {
            const isSelected = selectedAvatars.includes(index);
            const isAvailable = !isSelected;
            const isChosen = selectedAvatarIndex === index;

            return (
              <button
                key={index}
                onClick={() => handleAvatarClick(index)}
                disabled={!isAvailable}
                className={`
                  relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all
                  ${
                    isChosen
                      ? 'border-[#3730a3] bg-[#eef2ff] shadow-md'
                      : isAvailable
                      ? 'cursor-pointer border-[#d4cfc7] bg-white hover:scale-105 hover:border-[#3730a3] hover:shadow-md'
                      : 'cursor-not-allowed border-[#d4cfc7] bg-[#f5f2ed] opacity-50'
                  }
                `}
              >
                <div
                  className="h-32 w-32"
                  dangerouslySetInnerHTML={{ __html: getSpriteForDisplay(index) }}
                />
                <span className="text-lg font-semibold text-gray-700">
                  {t(language, avatarNameKeys[index])}
                </span>
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                    <span className="rounded bg-red-500 px-3 py-1 text-sm font-bold text-white">
                      {t(language, 'taken')}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Selection */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">{t(language, 'selectYourColor')}</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {AVAILABLE_COLORS.map((color) => {
            const isTaken = selectedColors.includes(color.hex);
            const isChosen = selectedColor === color.hex;

            return (
              <button
                key={color.hex}
                onClick={() => handleColorClick(color.hex)}
                disabled={isTaken}
                className={`
                  relative flex h-20 w-20 flex-col items-center justify-center rounded-lg border-4 transition-all
                  ${
                    isChosen
                      ? 'scale-110 border-[#3730a3] shadow-lg ring-2 ring-[#3730a3]'
                      : isTaken
                      ? 'cursor-not-allowed border-gray-300 opacity-40'
                      : 'cursor-pointer border-transparent hover:scale-110 hover:border-white hover:shadow-lg'
                  }
                `}
                style={{ backgroundColor: color.hex }}
              >
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {t(language, color.nameKey)}
                </span>
                {isTaken && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                    <span className="text-xs font-bold text-white">{t(language, 'taken')}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-6">
        <button
          onClick={handleConfirm}
          disabled={selectedAvatarIndex === null || selectedColor === null}
          style={{
            background: selectedAvatarIndex !== null && selectedColor !== null ? 'var(--ed-accent, #3730a3)' : '#9ca3af',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.75rem 2rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { if (selectedAvatarIndex !== null && selectedColor !== null) e.currentTarget.style.background = 'var(--ed-accent-hover, #312e81)'; }}
          onMouseLeave={(e) => { if (selectedAvatarIndex !== null && selectedColor !== null) e.currentTarget.style.background = 'var(--ed-accent, #3730a3)'; }}
          className={`
            ${
              selectedAvatarIndex !== null && selectedColor !== null
                ? 'cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }
          `}
        >
          {t(language, 'confirmSelection')}
        </button>
      </div>
    </div>
  );
}
