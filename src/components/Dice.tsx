'use client';

interface DiceProps {
  value: number;
  isRolling: boolean;
  label: string;
  onClick: () => void;
}

export default function Dice({ value, isRolling, label, onClick }: DiceProps) {
  return (
    <div className="fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 p-8 text-center shadow-xl">
      <div
        onClick={onClick}
        className={`mx-auto my-2.5 inline-flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-2xl border-4 border-slate-700 bg-gradient-to-br from-white to-gray-100 text-6xl font-bold text-black shadow-lg transition-all ${
          isRolling
            ? 'animate-dice-roll cursor-not-allowed'
            : 'hover:scale-110 hover:rotate-6 hover:shadow-xl'
        }`}
      >
        {value === 0 ? '🎲' : value}
      </div>
      <div className="mt-4 text-lg font-semibold text-black">{label}</div>
    </div>
  );
}
