'use client';

import { useState } from 'react';
import { ImportedProblemsData } from '@/types/imported-problems';
import { LocalUploadProvider } from '@/game/providers/LocalUploadProvider';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface ProblemUploadProps {
  provider: LocalUploadProvider;
  onLoaded: (data: ImportedProblemsData) => void;
}

export default function ProblemUpload({ provider, onLoaded }: ProblemUploadProps) {
  const { language } = useLanguage();
  const [fileName, setFileName] = useState('');
  const [problemCount, setProblemCount] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    try {
      const data = await provider.loadFromFile(file);
      setProblemCount(data.problemCount);
      onLoaded(data);
    } catch (err) {
      setError('Invalid JSON file. Please check the format.');
      console.error('JSON parse error:', err);
    }
  };

  return (
    <div style={{
      marginTop: '1rem',
      borderRadius: '6px',
      border: '1px dashed var(--ed-border, #d4cfc7)',
      background: 'var(--ed-surface-alt, #f5f2ed)',
      padding: '1rem',
    }}>
      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ed-text, #2c2825)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>
        {t(language, 'importMathProblems')}
      </label>
      <p style={{ marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--ed-text-dim, #6b6560)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>
        {t(language, 'uploadJsonFile')}
      </p>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="w-full text-sm text-black file:mr-3 file:rounded file:border-0 file:bg-[#3730a3] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white file:cursor-pointer hover:file:bg-[#312e81]"
      />
      {fileName && (
        <div className="mt-2 text-sm font-medium text-green-600">
          {t(language, 'loaded')} {fileName} ({problemCount} {t(language, 'problems')})
        </div>
      )}
      {error && (
        <div className="mt-2 text-sm font-medium text-red-600">
          {t(language, 'invalidJsonFile')}
        </div>
      )}
    </div>
  );
}
