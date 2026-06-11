'use client';

import { useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n/translations';
import MathText from './MathText';

interface MessageModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  streak?: number;
  autoClose?: boolean;
  problem?: string;
  userAnswer?: number;
  isTimeout?: boolean;
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

export default function MessageModal({ isOpen, message, type, onClose, streak = 0, autoClose = true, problem, userAnswer, isTimeout = false }: MessageModalProps) {
  const { language } = useLanguage();

  // Pick a random emoji when modal opens
  const randomEmoji = useMemo(() => {
    const emojiList = type === 'success' ? correctAnswerEmojis : wrongAnswerEmojis;
    return emojiList[Math.floor(Math.random() * emojiList.length)];
  }, [isOpen, type]);

  // Determine animation based on type and streak (with 50% chance except for streaks)
  const emojiAnimation = useMemo(() => {
    if (type === 'success' && streak >= 3) {
      // Always animate on 3+ streak
      return 'animate-spin-grow';
    } else if (type === 'success') {
      // 50% chance of animation on normal success
      return Math.random() < 0.5 ? 'animate-wiggle' : '';
    } else {
      // 50% chance of animation on failure
      return Math.random() < 0.5 ? 'animate-shake' : '';
    }
  }, [isOpen, type, streak]);

  // Auto-close after 2.5 seconds (if enabled)
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90%] max-w-[500px] animate-slide-in rounded-2xl bg-white p-10 text-center">
        <div className={`mb-5 text-6xl ${emojiAnimation}`}>
          {randomEmoji}
        </div>
        <div className={`text-2xl font-bold ${
          type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {type === 'success' ? t(language, 'correctAnswer') : isTimeout ? t(language, 'timesUp') : t(language, 'wrongAnswer')}
        </div>
        {problem && (
          <div className="my-4 flex items-center justify-center gap-2 text-xl font-semibold text-gray-700">
            <MathText
              text={problem}
              className="max-w-[350px] px-2 py-2 whitespace-normal break-words"
            />
            <span className="shrink-0">= ?</span>
          </div>
        )}
        {userAnswer !== undefined && (
          <div className={`text-lg font-semibold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {t(language, 'yourAnswer')}: {userAnswer}
          </div>
        )}
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
          {t(language, 'continue')}
        </button>
      </div>
    </div>
  );
}
