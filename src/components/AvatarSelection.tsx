'use client';

import { useState } from 'react';
import { playerSprites } from './PlayerSprites';
import { colorizePlayerSprite } from '@/game/utils/svgColorizer';

interface AvatarSelectionProps {
  playerNumber: number;
  selectedAvatars: number[];
  selectedColors: string[];
  onSelectAvatar: (avatarIndex: number, color: string) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Blue', hex: '#3498db' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Orange', hex: '#f39c12' },
  { name: 'Purple', hex: '#9b59b6' },
  { name: 'Pink', hex: '#e91e63' },
  { name: 'Teal', hex: '#1abc9c' },
  { name: 'Yellow', hex: '#f1c40f' },
];

export default function AvatarSelection({
  playerNumber,
  selectedAvatars,
  selectedColors,
  onSelectAvatar,
}: AvatarSelectionProps) {
  const avatarNames = ['Knight', 'Wizard', 'Archer', 'Rogue'];
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleAvatarClick = (index: number) => {
    if (!selectedAvatars.includes(index)) {
      setSelectedAvatarIndex(index);
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

  // Show avatar preview with selected color
  const getPreviewSprite = () => {
    if (selectedAvatarIndex === null || selectedColor === null) return null;
    return colorizePlayerSprite(selectedAvatarIndex, playerSprites[selectedAvatarIndex], selectedColor);
  };

  return (
    <div className="text-center">
      <h2 className="mb-6 text-3xl font-bold text-purple-700">
        Player {playerNumber} - Choose Your Character
      </h2>

      {/* Avatar Selection */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">1. Select Your Class</h3>
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
                  relative flex flex-col items-center gap-3 rounded-xl border-4 p-6 transition-all
                  ${
                    isChosen
                      ? 'border-purple-600 bg-purple-50 shadow-lg'
                      : isAvailable
                      ? 'cursor-pointer border-purple-300 bg-white hover:scale-105 hover:border-purple-500 hover:shadow-xl'
                      : 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50'
                  }
                `}
              >
                <div
                  className="h-32 w-32"
                  dangerouslySetInnerHTML={{ __html: sprite }}
                />
                <span className="text-lg font-semibold text-gray-700">
                  {avatarNames[index]}
                </span>
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                    <span className="rounded bg-red-500 px-3 py-1 text-sm font-bold text-white">
                      Taken
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
        <h3 className="mb-4 text-xl font-semibold text-gray-700">2. Select Your Color</h3>
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
                      ? 'scale-110 border-purple-600 shadow-xl'
                      : isTaken
                      ? 'cursor-not-allowed border-gray-300 opacity-40'
                      : 'cursor-pointer border-transparent hover:scale-110 hover:border-purple-400 hover:shadow-lg'
                  }
                `}
                style={{ backgroundColor: color.hex }}
              >
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {color.name}
                </span>
                {isTaken && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                    <span className="text-xs font-bold text-white">Taken</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview and Confirm */}
      {selectedAvatarIndex !== null && selectedColor !== null && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">Preview</h3>
          <div className="mb-4 flex justify-center">
            <div
              className="h-40 w-40"
              dangerouslySetInnerHTML={{ __html: getPreviewSprite() || '' }}
            />
          </div>
          <button
            onClick={handleConfirm}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 px-8 py-3 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Confirm Selection
          </button>
        </div>
      )}
    </div>
  );
}
