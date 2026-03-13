'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface TeleporterPromptProps {
  isOpen: boolean;
  selectedTile: number | null;
  onConfirm: (tileIndex: number) => void;
  onCancel: () => void;
}

export default function TeleporterPrompt({
  isOpen,
  selectedTile,
  onConfirm,
  onCancel,
}: TeleporterPromptProps) {
  const { language } = useLanguage();

  // Prevent the touch that selected a tile from immediately triggering cancel
  // on the newly-rendered overlay (touch event race condition)
  const [overlayReady, setOverlayReady] = useState(false);
  useEffect(() => {
    if (selectedTile !== null) {
      setOverlayReady(false);
      const timer = setTimeout(() => setOverlayReady(true), 500);
      return () => clearTimeout(timer);
    } else {
      setOverlayReady(false);
    }
  }, [selectedTile]);

  if (!isOpen) return null;

  return (
    <>
      {/* During selection phase, show prompt at top and allow board clicks through */}
      {selectedTile === null ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pointer-events-none pt-2 sm:pt-4">
          <div className="rounded-2xl bg-white/95 p-4 text-center shadow-xl pointer-events-auto sm:p-8">
            <div className="mb-2 text-4xl sm:mb-4 sm:text-6xl">✨</div>
            <h2 className="mb-1 text-lg font-bold text-purple-700 sm:mb-2 sm:text-2xl">
              {t(language, 'teleporter_label')}
            </h2>
            <p className="text-sm text-gray-700 sm:text-lg">{t(language, 'tapTileToTeleport')}</p>
          </div>
        </div>
      ) : (
        /* Once tile selected, show confirmation modal with overlay */
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          {/* Overlay - capture clicks outside modal to cancel (delayed to avoid touch race) */}
          <div
            className="fixed inset-0"
            onClick={overlayReady ? onCancel : undefined}
          />

          {/* Confirmation Modal */}
          <div
            className="fixed left-1/2 top-1/2 z-[1101] -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] animate-slide-in rounded-2xl bg-white p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-6xl">✨</div>
            <h2 className="mb-3 text-2xl font-bold text-purple-700">
              {t(language, 'teleportConfirm')}
            </h2>
            <p className="mb-6 text-lg text-gray-700">
              {t(language, 'teleportTo', { tile: selectedTile })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                {t(language, 'cancel')}
              </button>
              <button
                onClick={() => onConfirm(selectedTile)}
                className="flex-1 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 active:scale-95"
              >
                {t(language, 'teleportButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
