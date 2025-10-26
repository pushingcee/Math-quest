'use client';

import { useMemo } from 'react';

interface MessageModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const wrongAnswerEmojis = [
  '🤪', // Zany Face
  '😵‍💫', // Face with Spiral Eyes
  '🤯', // Exploding Head
  '🫠', // Melting Face
  '🧐', // Face with Monocle
  '🤨', // Face with Raised Eyebrow
  '🙈', // See-No-Evil Monkey
  '🙉', // Hear-No-Evil Monkey
  '🙊', // Speak-No-Evil Monkey
  '🤦', // Person Facepalming
  '🤦‍♂️', // Man Facepalming
  '🤦‍♀️', // Woman Facepalming
  '🤷', // Person Shrugging
  '🤷‍♂️', // Man Shrugging
  '🤷‍♀️', // Woman Shrugging
];

const correctAnswerEmojis = [
  '😎', // Cool
  '🧐', // Monocle
  '💪', // Muscle
  '🔥', // Fire
  '👑', // Crown
  '🎩', // Top Hat
  '🕺', // Man Dancing
  '💃', // Woman Dancing
  '🤓', // Nerd
  '😤', // Triumph
  '🦁', // Lion
  '🚀', // Rocket
  '⚡', // Lightning
  '🌟', // Star
  '🏆', // Trophy
  '🎯', // Bullseye
  '🧠', // Brain
  '💎', // Diamond
  '👾', // Alien
  '✨', // Sparkles
];

export default function MessageModal({ isOpen, message, type, onClose }: MessageModalProps) {
  // Pick a random emoji when modal opens
  const randomEmoji = useMemo(() => {
    const emojiList = type === 'success' ? correctAnswerEmojis : wrongAnswerEmojis;
    return emojiList[Math.floor(Math.random() * emojiList.length)];
  }, [isOpen, type]);

  console.log('MessageModal render:', { isOpen, message, type });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90%] max-w-[500px] animate-slide-in rounded-2xl bg-white p-10 text-center">
        <div className="mb-5 text-6xl">
          {randomEmoji}
        </div>
        <div className={`text-2xl font-bold ${
          type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {type === 'success' ? 'Correct!' : message.includes('ran out of time') ? 'Time\'s Up!' : 'Wrong!'}
        </div>
        <div className="my-5 text-xl text-black">
          {message}
        </div>
        <button
          onClick={onClose}
          className={`w-full rounded-full px-8 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${
            type === 'success'
              ? 'bg-gradient-to-br from-green-500 to-green-700 hover:shadow-green-500/40'
              : 'bg-gradient-to-br from-red-500 to-red-700 hover:shadow-red-500/40'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
