'use client';

import { useState, useMemo } from 'react';
import { ImportedProblemsData } from '@/types/imported-problems';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';
import LanguageSelector from './LanguageSelector';
import { LocalUploadProvider } from '@/game/providers/LocalUploadProvider';
import { PersistedSetProvider } from '@/game/providers/PersistedSetProvider';
import ProblemUpload from './ProblemUpload';
import ProblemSetSelector from './ProblemSetSelector';

const FF_UPLOAD = process.env.NEXT_PUBLIC_FF_UPLOAD_PROBLEMS !== 'false';
const FF_PERSISTED = process.env.NEXT_PUBLIC_FF_PERSISTED_PROBLEM_SETS === 'true';

interface GameSetupProps {
  onStart: (playerCount: number, importedProblems?: ImportedProblemsData, negativePoints?: boolean, timerEnabled?: boolean, timerValue?: number, autoCloseModal?: boolean, displayProblemsInTiles?: boolean) => void;
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--ed-surface, #ffffff)',
  border: '1px solid var(--ed-border, #d4cfc7)',
  borderRadius: '6px',
  padding: '0.375rem 0.75rem',
  fontSize: '0.9375rem',
  color: 'var(--ed-text, #2c2825)',
  fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
  outline: 'none',
  transition: 'border-color 150ms ease',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--ed-text, #2c2825)',
  fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'var(--ed-text-dim, #6b6560)',
  fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
  textTransform: 'uppercase' as const,
  marginBottom: '0.75rem',
};

export default function GameSetup({ onStart }: GameSetupProps) {
  const { language } = useLanguage();
  const [playerCount, setPlayerCount] = useState(1);
  const [importedProblems, setImportedProblems] = useState<ImportedProblemsData | null>(null);
  const [pendingUpload, setPendingUpload] = useState<ImportedProblemsData | null>(null);

  const persistedProvider = useMemo(
    () => (FF_PERSISTED ? new PersistedSetProvider() : null),
    []
  );
  const uploadProvider = useMemo(
    () => (FF_UPLOAD ? new LocalUploadProvider() : null),
    []
  );

  const [negativePoints, setNegativePoints] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerValue, setTimerValue] = useState<number | string>(30);
  const [autoCloseModal, setAutoCloseModal] = useState(false);
  const [displayProblemsInTiles, setDisplayProblemsInTiles] = useState(false);

  const handleProblemsLoaded = (data: ImportedProblemsData) => {
    setImportedProblems(data);
    if (FF_PERSISTED) {
      setPendingUpload(data);
    }
  };

  const handleStart = () => {
    const validTimerValue = typeof timerValue === 'string' ? parseInt(timerValue) || 30 : timerValue;
    onStart(playerCount, importedProblems || undefined, negativePoints, timerEnabled, validTimerValue, autoCloseModal, displayProblemsInTiles);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0.5rem 0' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
          fontWeight: 700,
          fontSize: '1.25rem',
          color: 'var(--ed-text, #2c2825)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          {t(language, 'gameSetup')}
        </h2>
        <LanguageSelector />
      </div>

      {/* Players */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={sectionLabelStyle}>{t(language, 'numberOfPlayers')}</p>
        <select
          value={playerCount}
          onChange={(e) => setPlayerCount(parseInt(e.target.value))}
          style={{ ...fieldStyle, width: '100%' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ed-accent, #3730a3)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ed-border, #d4cfc7)'; }}
        >
          <option value={1}>{t(language, 'player1')}</option>
          <option value={2}>{t(language, 'player2')}</option>
          <option value={3}>{t(language, 'player3')}</option>
          <option value={4}>{t(language, 'player4')}</option>
        </select>
      </div>

      {/* Settings */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={sectionLabelStyle}>Settings</p>
        <div style={{
          background: 'var(--ed-surface, #ffffff)',
          border: '1px solid var(--ed-border, #d4cfc7)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          {/* Negative points */}
          <label style={{
            ...labelStyle,
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--ed-border, #d4cfc7)',
          }}>
            <input
              type="checkbox"
              checked={negativePoints}
              onChange={(e) => setNegativePoints(e.target.checked)}
              style={{ accentColor: 'var(--ed-accent, #3730a3)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>{t(language, 'enableNegativePoints')}</span>
          </label>

          {/* Timer */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--ed-border, #d4cfc7)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                style={{ accentColor: 'var(--ed-accent, #3730a3)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>{t(language, 'enableTimer')}</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={timerValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setTimerValue(val === '' ? '' : parseInt(val));
                }
              }}
              onBlur={() => {
                const num = typeof timerValue === 'string' ? parseInt(timerValue) : timerValue;
                if (isNaN(num) || timerValue === '') setTimerValue(30);
                else if (num < 5) setTimerValue(5);
                else if (num > 300) setTimerValue(300);
              }}
              disabled={!timerEnabled}
              style={{
                ...fieldStyle,
                width: '4rem',
                textAlign: 'center',
                opacity: timerEnabled ? 1 : 0.4,
                cursor: timerEnabled ? 'text' : 'not-allowed',
              }}
              onFocus={(e) => { if (timerEnabled) e.currentTarget.style.borderColor = 'var(--ed-accent, #3730a3)'; }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--ed-text-dim, #6b6560)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>
              {t(language, 'seconds')}
            </span>
          </div>

          {/* Auto-close modal */}
          <label style={{
            ...labelStyle,
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--ed-border, #d4cfc7)',
          }}>
            <input
              type="checkbox"
              checked={autoCloseModal}
              onChange={(e) => setAutoCloseModal(e.target.checked)}
              style={{ accentColor: 'var(--ed-accent, #3730a3)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>{t(language, 'enableModalAutoClose')}</span>
          </label>

          {/* Display problems in tiles */}
          <label style={{ ...labelStyle, padding: '0.75rem 1rem' }}>
            <input
              type="checkbox"
              checked={displayProblemsInTiles}
              onChange={(e) => setDisplayProblemsInTiles(e.target.checked)}
              style={{ accentColor: 'var(--ed-accent, #3730a3)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>{t(language, 'displayProblemsInTiles')}</span>
          </label>
        </div>
      </div>

      {/* Problem sourcing — gated by feature flags */}
      {FF_UPLOAD && uploadProvider && (
        <ProblemUpload provider={uploadProvider} onLoaded={handleProblemsLoaded} />
      )}

      {FF_PERSISTED && persistedProvider && (
        <ProblemSetSelector
          provider={persistedProvider}
          onSelected={(data) => setImportedProblems(data)}
          pendingUpload={FF_UPLOAD ? pendingUpload : undefined}
          onSaved={() => setPendingUpload(null)}
        />
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        style={{
          width: '100%',
          padding: '0.75rem 2rem',
          background: 'var(--ed-accent, #3730a3)',
          color: 'var(--ed-accent-text, #ffffff)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
          cursor: 'pointer',
          transition: 'background 150ms ease',
          marginTop: '0.5rem',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ed-accent-hover, #312e81)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ed-accent, #3730a3)'; }}
      >
        {t(language, 'startGame')}
      </button>
    </div>
  );
}
