'use client';

import { useState } from 'react';

interface GameSetupProps {
  onStart: (playerCount: number) => void;
}

export default function GameSetup({ onStart }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);

  return (
    <div className="text-center">
      <h2 className="mb-5 text-2xl font-semibold text-black">Game Setup</h2>
      <label className="mb-2.5 block text-xl text-black">
        Number of Players:
        <select
          value={playerCount}
          onChange={(e) => setPlayerCount(parseInt(e.target.value))}
          className="ml-2.5 rounded-lg border-2 border-purple-500 bg-white px-3 py-1.5 text-lg text-black transition-all hover:border-purple-600 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
        </select>
      </label>
      <button
        onClick={() => onStart(playerCount)}
        className="mt-5 w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-8 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40"
      >
        Start Game
      </button>
    </div>
  );
}
