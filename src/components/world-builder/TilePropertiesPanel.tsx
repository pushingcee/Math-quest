'use client';

import { useState, useEffect } from 'react';
import { EditorTile } from './worldBuilderTypes';

interface TilePropertiesPanelProps {
  tile: EditorTile;
  allTileIds: string[];
  isConnectMode: boolean;
  onUpdate: (patch: Partial<EditorTile>) => void;
  onDelete: () => void;
  onEnterConnectMode: () => void;
  onClearConnection: () => void;
}

export default function TilePropertiesPanel({
  tile,
  allTileIds,
  isConnectMode,
  onUpdate,
  onDelete,
  onEnterConnectMode,
  onClearConnection,
}: TilePropertiesPanelProps) {
  // Local ID state — committed on blur to allow rename validation
  const [localId, setLocalId] = useState(tile.id);

  // Sync when a different tile is selected
  useEffect(() => {
    setLocalId(tile.id);
  }, [tile.id]);

  function commitId() {
    const trimmed = localId.trim();
    if (trimmed && trimmed !== tile.id) {
      onUpdate({ id: trimmed });
    } else {
      setLocalId(tile.id); // revert if blank or unchanged
    }
  }

  const labelForType: Record<EditorTile['type'], string> = {
    regular: 'Regular',
    obstacle: tile.obstacleType === 'slip' ? 'Obstacle (Slip)' : 'Obstacle (Trap)',
    shop: 'Shop (2×2)',
    corner: 'Corner (2×2)',
    modifier: 'Modifier (2×2)',
  };

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-200">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</p>

      {/* Type badge */}
      <div>
        <span className="text-xs text-slate-400">Type</span>
        <p className="font-semibold">{labelForType[tile.type]}</p>
      </div>

      {/* ID */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">ID</label>
        <input
          value={localId}
          onChange={(e) => setLocalId(e.target.value)}
          onBlur={commitId}
          onKeyDown={(e) => e.key === 'Enter' && commitId()}
          className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-400"
        />
      </div>

      {/* Connects To */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">Connects To</label>
        {tile.connectsTo ? (
          <div className="flex items-center gap-1">
            <span className="flex-1 px-2 py-1 rounded bg-slate-700 text-xs font-mono text-sky-300 truncate">
              {tile.connectsTo}
            </span>
            <button
              onClick={onClearConnection}
              className="px-2 py-1 rounded bg-slate-600 hover:bg-red-700 text-slate-300 hover:text-white text-xs transition-colors"
              title="Clear connection"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-slate-500 text-xs italic">none</span>
        )}

        {tile.type !== 'modifier' && (
          <button
            onClick={onEnterConnectMode}
            disabled={isConnectMode}
            className={`
              mt-2 w-full px-2 py-1.5 rounded text-xs font-semibold transition-colors
              ${isConnectMode
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-sky-700 hover:bg-sky-600 text-white'}
            `}
          >
            {isConnectMode ? '🟢 Click target tile…' : 'Set Connection'}
          </button>
        )}
      </div>

      {/* Obstacle type */}
      {tile.type === 'obstacle' && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">Obstacle Type</label>
          <div className="flex gap-2">
            {(['slip', 'trap'] as const).map((ot) => (
              <label key={ot} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="obstacleType"
                  value={ot}
                  checked={tile.obstacleType === ot}
                  onChange={() => onUpdate({ obstacleType: ot })}
                  className="accent-sky-400"
                />
                <span className="capitalize">{ot}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Label (corner / modifier / shop) */}
      {(tile.type === 'corner' || tile.type === 'modifier' || tile.type === 'shop') && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">Label</label>
          <input
            value={tile.label ?? ''}
            onChange={(e) => onUpdate({ label: e.target.value || undefined })}
            placeholder="e.g. START<br>+50pts"
            className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
          />
        </div>
      )}

      {/* onLand */}
      <div>
        <label className="text-xs text-slate-400 block mb-1">On Land</label>
        <div className="flex gap-1 mb-1">
          <input
            type="number"
            value={tile.onLand?.scoreChange ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onUpdate({
                onLand: val !== undefined
                  ? { scoreChange: val, message: tile.onLand?.message ?? '' }
                  : undefined,
              });
            }}
            placeholder="Score ±"
            className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
          />
          <input
            value={tile.onLand?.message ?? ''}
            onChange={(e) => {
              onUpdate({
                onLand: tile.onLand
                  ? { ...tile.onLand, message: e.target.value }
                  : { scoreChange: 0, message: e.target.value },
              });
            }}
            placeholder="Message"
            className="flex-1 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Modifier multiplier */}
      {tile.type === 'modifier' && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">Points Multiplier</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={tile.modifierEffect?.pointsMultiplier ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onUpdate({ modifierEffect: { pointsMultiplier: val } });
            }}
            placeholder="e.g. 2"
            className="w-24 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
          />
        </div>
      )}

      {/* Position (read-only) */}
      <div>
        <span className="text-xs text-slate-400">Position</span>
        <p className="text-xs font-mono text-slate-300">
          row {tile.row}, col {tile.col}
          {tile.span > 1 && ` (${tile.span}×${tile.span})`}
        </p>
      </div>

      <div className="border-t border-slate-700 pt-2">
        <button
          onClick={onDelete}
          className="w-full px-3 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
        >
          Delete Tile
        </button>
      </div>
    </div>
  );
}
