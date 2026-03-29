'use client';

import { useState, useEffect } from 'react';
import { ImportedProblemsData } from '@/types/imported-problems';
import { PersistedSetProvider } from '@/game/providers/PersistedSetProvider';
import { ProblemSetMeta } from '@/game/providers/types';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

interface ProblemSetSelectorProps {
  provider: PersistedSetProvider;
  onSelected: (data: ImportedProblemsData) => void;
  /** When set, shows a "Save" button to persist this uploaded data */
  pendingUpload?: ImportedProblemsData | null;
  onSaved?: () => void;
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--ed-surface, #ffffff)',
  border: '1px solid var(--ed-border, #d4cfc7)',
  borderRadius: '6px',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--ed-text, #2c2825)',
  fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
  outline: 'none',
};

export default function ProblemSetSelector({
  provider,
  onSelected,
  pendingUpload,
  onSaved,
}: ProblemSetSelectorProps) {
  const { language } = useLanguage();
  const [sets, setSets] = useState<ProblemSetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    provider
      .listSets()
      .then(setSets)
      .catch(() => setError('Failed to load problem sets'))
      .finally(() => setLoading(false));
  }, [provider]);

  const handleSelect = async (id: string) => {
    try {
      const data = await provider.getProblemSet(id);
      onSelected(data);
    } catch {
      setError('Failed to load problem set');
    }
  };

  const handleSave = async () => {
    if (!pendingUpload || !saveName.trim()) return;
    setSaving(true);
    try {
      const meta = await provider.saveSet(saveName.trim(), pendingUpload);
      setSets((prev) => [meta, ...prev]);
      setSaveName('');
      onSaved?.();
    } catch {
      setError('Failed to save problem set');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      marginTop: '1rem',
      borderRadius: '6px',
      border: '1px solid var(--ed-border, #d4cfc7)',
      background: 'var(--ed-surface, #ffffff)',
      padding: '1rem',
    }}>
      <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ed-text, #2c2825)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>
        {t(language, 'savedProblemSets') ?? 'Saved Problem Sets'}
      </h3>

      {/* Save pending upload */}
      {pendingUpload && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            placeholder="Name this set..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--ed-accent, #3730a3)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--ed-border, #d4cfc7)'; }}
          />
          <button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            style={{
              background: 'var(--ed-accent, #3730a3)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.375rem 0.875rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
              cursor: saving || !saveName.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !saveName.trim() ? 0.5 : 1,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { if (!saving && saveName.trim()) e.currentTarget.style.background = 'var(--ed-accent-hover, #312e81)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ed-accent, #3730a3)'; }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Set list */}
      {loading && <p style={{ fontSize: '0.875rem', color: 'var(--ed-text-muted, #9b948c)' }}>Loading...</p>}
      {error && <p style={{ fontSize: '0.875rem', color: 'var(--ed-danger, #991b1b)' }}>{error}</p>}
      {!loading && sets.length === 0 && (
        <p style={{ fontSize: '0.875rem', color: 'var(--ed-text-muted, #9b948c)' }}>No saved problem sets yet.</p>
      )}
      {sets.map((set) => (
        <button
          key={set.id}
          onClick={() => handleSelect(set.id)}
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.375rem',
            background: 'var(--ed-surface, #ffffff)',
            border: '1px solid var(--ed-border, #d4cfc7)',
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 150ms ease, background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--ed-accent, #3730a3)';
            e.currentTarget.style.background = 'var(--ed-accent-light, #eef2ff)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--ed-border, #d4cfc7)';
            e.currentTarget.style.background = 'var(--ed-surface, #ffffff)';
          }}
        >
          <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--ed-text, #2c2825)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>{set.name}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ed-text-dim, #6b6560)', fontFamily: 'var(--font-source-sans), system-ui, sans-serif' }}>
            {set.problemCount} {t(language, 'problems')}
          </span>
        </button>
      ))}
    </div>
  );
}
