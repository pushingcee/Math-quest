'use client';

import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <button
        onClick={() => setLanguage('bg')}
        style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: language === 'bg' ? 'var(--ed-accent, #3730a3)' : 'var(--ed-border, #d4cfc7)',
          background: language === 'bg' ? 'var(--ed-accent-light, #eef2ff)' : 'transparent',
          color: language === 'bg' ? 'var(--ed-accent, #3730a3)' : 'var(--ed-text-dim, #6b6560)',
          fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: language === 'bg' ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        🇧🇬 {t(language, 'bulgarian')}
      </button>
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: language === 'en' ? 'var(--ed-accent, #3730a3)' : 'var(--ed-border, #d4cfc7)',
          background: language === 'en' ? 'var(--ed-accent-light, #eef2ff)' : 'transparent',
          color: language === 'en' ? 'var(--ed-accent, #3730a3)' : 'var(--ed-text-dim, #6b6560)',
          fontFamily: 'var(--font-source-sans), system-ui, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: language === 'en' ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        🇬🇧 {t(language, 'english')}
      </button>
    </div>
  );
}
