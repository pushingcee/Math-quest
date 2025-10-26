'use client';

import { Player } from '@/types/game';

interface GameOverProps {
  players: Player[];
  onPlayAgain: () => void;
}

export default function GameOver({ players, onPlayAgain }: GameOverProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isSinglePlayer = players.length === 1;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 p-8 text-center text-white">
      <div className="mb-5 animate-pulse text-4xl font-bold">
        {isSinglePlayer ? (
          <>
            🎯 Game Complete! 🎯
            <br />
            Final Score: {winner.score} points
          </>
        ) : (
          <>
            🏆 {winner.name} Wins! 🏆
            <br />
            Final Score: {winner.score} points
          </>
        )}
      </div>
      <div className="my-5 rounded-lg bg-white/20 p-5 backdrop-blur-sm">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className="my-2.5 text-xl">
            {index + 1}. {player.name}: {player.score} points
          </div>
        ))}
      </div>
      <button
        onClick={onPlayAgain}
        className="w-full rounded-full bg-white px-8 py-3 text-lg font-bold text-rose-500 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        Play Again
      </button>
    </div>
  );
}
