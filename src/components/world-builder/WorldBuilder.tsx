'use client';

import { useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useWorldBuilderState } from './useWorldBuilderState';
import TilePalette from './TilePalette';
import TilePropertiesPanel from './TilePropertiesPanel';

// Dynamic import keeps PixiJS out of SSR
const WorldBuilderCanvas = dynamic(() => import('./WorldBuilderCanvas'), { ssr: false });

export default function WorldBuilder() {
  const {
    state,
    placeTile,
    removeTile,
    removeSelectedTiles,
    moveTile,
    moveSelectedTiles,
    updateTile,
    selectTile,
    selectTiles,
    setActivePalette,
    enterConnectMode,
    resolveConnection,
    clearConnection,
    cancelConnectMode,
    setBoardName,
    setStartTileId,
    exportJSON,
    importJSON,
    loadDefault,
  } = useWorldBuilderState();

  const { selectedTileIds } = state;
  const singleSelectedTile = selectedTileIds.length === 1
    ? state.tiles.find((t) => t.id === selectedTileIds[0]) ?? null
    : null;

  // Keyboard: Escape cancels connect mode or deselects; Delete removes selected
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (state.connectMode) cancelConnectMode();
        else selectTile(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTileIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        removeSelectedTiles();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.connectMode, selectedTileIds, cancelConnectMode, selectTile, removeSelectedTiles]);

  const handleExport = useCallback(() => {
    const json = exportJSON();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.boardId || 'board'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON, state.boardId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <h1 className="text-lg font-bold text-sky-400 whitespace-nowrap">World Builder</h1>

        <input
          value={state.boardName}
          onChange={(e) => setBoardName(e.target.value)}
          placeholder="Board name…"
          className="px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:border-sky-400 w-48"
        />

        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-400 whitespace-nowrap">Start tile</label>
          <select
            value={state.startTileId}
            onChange={(e) => setStartTileId(e.target.value)}
            className="px-2 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:border-sky-400"
          >
            <option value="">— none —</option>
            {state.tiles
              .filter((t) => t.type !== 'modifier' && t.type !== 'corner')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto text-xs text-slate-400">
          <span>{state.tiles.length} tiles</span>
          {state.connectMode && (
            <span className="px-2 py-0.5 rounded bg-green-700 text-green-100 font-semibold animate-pulse">
              Connect mode — click target tile
            </span>
          )}
          {selectedTileIds.length > 1 && (
            <span className="px-2 py-0.5 rounded bg-sky-700 text-sky-100 font-semibold">
              {selectedTileIds.length} selected
            </span>
          )}
          <span className="hidden sm:block">Ctrl+click add • Shift+drag marquee • Esc deselect • Del remove</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — palette */}
        <aside className="w-44 flex-shrink-0 bg-slate-800 border-r border-slate-700 p-3 overflow-y-auto">
          <TilePalette
            active={state.activePalette}
            onSelect={setActivePalette}
            onExport={handleExport}
            onImport={importJSON}
            onLoadDefault={loadDefault}
          />
        </aside>

        {/* Centre — canvas */}
        <main className="flex-1 flex items-start justify-center p-4 overflow-auto bg-slate-900">
          <WorldBuilderCanvas
            editorState={state}
            onPlaceTile={placeTile}
            onSelectTile={selectTile}
            onSelectTiles={selectTiles}
            onMoveTile={moveTile}
            onMoveSelectedTiles={moveSelectedTiles}
            onResolveConnection={resolveConnection}
            onCancelConnectMode={cancelConnectMode}
          />
        </main>

        {/* Right panel — properties / multi-select */}
        <aside
          className={`
            w-52 flex-shrink-0 bg-slate-800 border-l border-slate-700 p-3 overflow-y-auto
            transition-opacity duration-150
            ${selectedTileIds.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {singleSelectedTile ? (
            <TilePropertiesPanel
              tile={singleSelectedTile}
              allTileIds={state.tiles.map((t) => t.id)}
              isConnectMode={state.connectMode}
              onUpdate={(patch) => updateTile(singleSelectedTile.id, patch)}
              onDelete={() => removeTile(singleSelectedTile.id)}
              onEnterConnectMode={enterConnectMode}
              onClearConnection={() => clearConnection(singleSelectedTile.id)}
            />
          ) : selectedTileIds.length > 1 ? (
            <div className="flex flex-col gap-3 text-sm text-slate-200">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Multi-select
              </p>
              <p className="text-slate-300">{selectedTileIds.length} tiles selected</p>
              <p className="text-xs text-slate-500">Ctrl+click to toggle • Shift+drag marquee</p>
              <button
                onClick={removeSelectedTiles}
                className="w-full px-3 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                Delete All ({selectedTileIds.length})
              </button>
              <button
                onClick={() => selectTile(null)}
                className="w-full px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
              >
                Deselect All
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
