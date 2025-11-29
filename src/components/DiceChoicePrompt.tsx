'use client';

import { useEffect, useState, useRef } from 'react';

interface DiceChoicePromptProps {
  isOpen: boolean;
  onChoose: (roll: number) => void;
}

export default function DiceChoicePrompt({ isOpen, onChoose }: DiceChoicePromptProps) {
  const [roll1, setRoll1] = useState(0);
  const [roll2, setRoll2] = useState(0);
  const [rolling, setRolling] = useState(false);
  const diceAudioRef = useRef<HTMLAudioElement[]>([]);

  // Preload audio
  useEffect(() => {
    const diceSounds = ['dr2.mp3', 'dr3.mp3', 'dr4.mp3', 'dr5.mp3'];
    diceAudioRef.current = diceSounds.map(sound => {
      const audio = new Audio(`/${sound}`);
      audio.preload = 'auto';
      audio.load();
      return audio;
    });
  }, []);

  useEffect(() => {
    if (isOpen && roll1 === 0) {
      // Perform two dice rolls
      setRolling(true);

      // Play first dice sound
      setTimeout(() => {
        if (diceAudioRef.current.length > 0) {
          const randomIndex = Math.floor(Math.random() * diceAudioRef.current.length);
          const audio = diceAudioRef.current[randomIndex];
          audio.currentTime = 0;
          audio.play().catch(e => console.log('Audio play failed:', e));
        }

        const first = Math.floor(Math.random() * 6) + 1;
        setRoll1(first);

        // Play second dice sound
        setTimeout(() => {
          if (diceAudioRef.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * diceAudioRef.current.length);
            const audio = diceAudioRef.current[randomIndex];
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
          }

          const second = Math.floor(Math.random() * 6) + 1;
          setRoll2(second);
          setRolling(false);
        }, 300);
      }, 300);
    }
  }, [isOpen, roll1]);

  if (!isOpen) return null;

  const handleChoice = (roll: number) => {
    // Stop all audio immediately when choice is made
    diceAudioRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    // Don't play another sound - just proceed with the choice
    onChoose(roll);
    setRoll1(0);
    setRoll2(0);
  };

  return (
    <div className="fixed left-1/2 top-1/2 z-[110] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 text-center shadow-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-black mb-2">🎲 Lucky Dice!</h2>
        <p className="text-sm text-slate-600">Choose the better roll</p>
      </div>

      <div className="flex justify-center gap-8 mx-auto my-2.5">
        {/* Roll 1 */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => roll1 > 0 && handleChoice(roll1)}
            className={`mx-auto my-2.5 inline-flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-2xl border-4 border-slate-700 bg-gradient-to-br from-white to-gray-100 text-6xl font-bold text-black shadow-lg transition-all ${
              rolling && roll1 === 0
                ? 'animate-dice-roll cursor-not-allowed'
                : roll1 > 0
                  ? 'hover:scale-110 hover:rotate-6 hover:shadow-xl'
                  : ''
            }`}
          >
            {roll1 === 0 ? '🎲' : roll1}
          </div>
          {roll1 > 0 && (
            <button
              onClick={() => handleChoice(roll1)}
              className="mt-3 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Choose
            </button>
          )}
        </div>

        {/* Roll 2 */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => roll2 > 0 && handleChoice(roll2)}
            className={`mx-auto my-2.5 inline-flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-2xl border-4 border-slate-700 bg-gradient-to-br from-white to-gray-100 text-6xl font-bold text-black shadow-lg transition-all ${
              rolling && roll2 === 0
                ? 'animate-dice-roll cursor-not-allowed'
                : roll2 > 0
                  ? 'hover:scale-110 hover:rotate-6 hover:shadow-xl'
                  : ''
            }`}
          >
            {roll2 === 0 ? '🎲' : roll2}
          </div>
          {roll2 > 0 && (
            <button
              onClick={() => handleChoice(roll2)}
              className="mt-3 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Choose
            </button>
          )}
        </div>
      </div>

      {rolling && (
        <p className="text-center text-slate-600 text-sm mt-4">Rolling...</p>
      )}
    </div>
  );
}
