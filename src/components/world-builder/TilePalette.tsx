'use client';

import { PaletteType } from './worldBuilderTypes';

interface PaletteItem {
  type: PaletteType;
  label: string;
  sublabel?: string;
  color: string;
  textColor?: string;
  emoji: string;
}

const ITEMS: PaletteItem[] = [
  { type: 'regular',       label: 'Regular',      color: '#92400e', emoji: '◆' },
  { type: 'obstacle-slip', label: 'Slip',          sublabel: 'obstacle', color: '#93c5fd', textColor: '#1e3a5f', emoji: '🧊' },
  { type: 'obstacle-trap', label: 'Trap',          sublabel: 'obstacle', color: '#fca5a5', textColor: '#7f1d1d', emoji: '⚠️' },
  { type: 'shop',          label: 'Shop',          sublabel: '2×2', color: '#fbbf24', textColor: '#78350f', emoji: '🏪' },
  { type: 'corner',        label: 'Corner',        sublabel: '2×2', color: '#fb7185', textColor: '#881337', emoji: '🚩' },
  { type: 'modifier',      label: 'Modifier',      sublabel: '2×2', color: '#f59e0b', textColor: '#78350f', emoji: '⭐' },
  { type: 'eraser',        label: 'Eraser',        color: '#64748b', emoji: '✕' },
];

interface TilePaletteProps {
  active: PaletteType;
  onSelect: (type: PaletteType) => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onLoadDefault: () => void;
}

export default function TilePalette({
  active,
  onSelect,
  onExport,
  onImport,
  onLoadDefault,
}: TilePaletteProps) {
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) onImport(text);
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tiles</p>

      {ITEMS.map((item) => {
        const isActive = active === item.type;
        return (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all
              ${isActive
                ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900 scale-[1.02]'
                : 'hover:brightness-110'
              }
            `}
            style={{
              background: item.color,
              color: item.textColor ?? '#fff',
            }}
          >
            <span className="text-base leading-none">{item.emoji}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight truncate">
                {item.label}
              </span>
              {item.sublabel && (
                <span className="block text-xs opacity-75 leading-tight">{item.sublabel}</span>
              )}
            </span>
            {isActive && (
              <span className="text-xs font-bold opacity-90">✓</span>
            )}
          </button>
        );
      })}

      <div className="border-t border-slate-700 my-2" />

      {/* Board actions */}
      <button
        onClick={onLoadDefault}
        className="w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
      >
        Load Default
      </button>

      <button
        onClick={onExport}
        className="w-full px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
      >
        Export JSON
      </button>

      <label className="w-full px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-sm font-medium transition-colors cursor-pointer text-center">
        Import JSON
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </div>
  );
}
