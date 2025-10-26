'use client';

import { useState, useEffect, KeyboardEvent } from 'react';

interface MathModalProps {
  isOpen: boolean;
  problem: string;
  timeLeft: number;
  onSubmit: (answer: number) => void;
}

export default function MathModal({ isOpen, problem, timeLeft, onSubmit }: MathModalProps) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnswer('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (answer) {
      onSubmit(parseInt(answer));
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90%] max-w-[500px] animate-slide-in rounded-2xl bg-white p-10 text-center">
        <h2 className="mb-5 text-2xl font-bold text-black">Solve the Math Problem!</h2>
        <div className="my-5 text-4xl font-bold text-black">
          {problem} = ?
        </div>
        <div className="my-2.5 text-xl text-red-500">
          Time: <span id="timer">{timeLeft}</span>s
        </div>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Your answer"
          autoFocus
          className="my-5 w-[200px] rounded-lg border-2 border-purple-500 p-2.5 text-center text-2xl text-black focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
        <button
          onClick={handleSubmit}
          className="w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-8 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
