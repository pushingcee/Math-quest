'use client';

import { useState } from 'react';
import { ImportedProblemsData } from '@/types/imported-problems';

interface GameSetupProps {
  onStart: (playerCount: number, importedProblems?: ImportedProblemsData) => void;
}

export default function GameSetup({ onStart }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(1);
  const [importedProblems, setImportedProblems] = useState<ImportedProblemsData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as ImportedProblemsData;

        // Validate the JSON structure
        if (!json.problems || !Array.isArray(json.problems)) {
          throw new Error('Invalid JSON format: missing problems array');
        }

        // Validate each problem has required fields
        const valid = json.problems.every(p =>
          p.id !== undefined && p.question !== undefined && p.answer !== undefined
        );

        if (!valid) {
          throw new Error('Invalid JSON format: problems must have id, question, and answer');
        }

        setImportedProblems(json);
        console.log('Imported problems:', json);
      } catch (err) {
        setError('Invalid JSON file. Please check the format.');
        setImportedProblems(null);
        console.error('JSON parse error:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleStart = () => {
    onStart(playerCount, importedProblems || undefined);
  };

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
          <option value={1}>1 Player (Solo)</option>
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
        </select>
      </label>

      <div className="mt-6 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-4">
        <label className="block text-lg font-semibold text-black mb-2">
          📁 Import Math Problems (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Upload a JSON file with custom math problems
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
        />
        {fileName && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            ✓ Loaded: {fileName} ({importedProblems?.problemCount} problems)
          </div>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-600 font-medium">
            ✗ {error}
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        className="mt-5 w-full rounded-full bg-gradient-to-br from-purple-500 to-purple-700 px-8 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40"
      >
        Start Game
      </button>
    </div>
  );
}
