'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface GameStateContextValue {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <GameStateContext.Provider value={{ isPlaying, setIsPlaying }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    return { isPlaying: false, setIsPlaying: () => {} };
  }
  return context;
}
