'use client';

import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface ItemPromptProps {
  isOpen: boolean;
  itemEmoji: string;
  itemName: string;
  promptMessage: string;
  onUse: () => void;
  onDecline: () => void;
}

export default function ItemPrompt({
  isOpen,
  itemEmoji,
  itemName,
  promptMessage,
  onUse,
  onDecline,
}: ItemPromptProps) {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90%] max-w-[400px] animate-slide-in rounded-2xl bg-white p-8 text-center">
        {/* Item Icon */}
        <div className="mb-4 text-6xl animate-wiggle">{itemEmoji}</div>

        {/* Prompt Message */}
        <h2 className="mb-3 text-2xl font-bold text-purple-700">
          {t(language, 'useItemPrompt', { name: itemName })}
        </h2>
        <p className="mb-6 text-lg text-gray-700">{promptMessage}</p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            {t(language, 'noThanks')}
          </button>
          <button
            onClick={onUse}
            className="flex-1 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95"
          >
            {t(language, 'useIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
