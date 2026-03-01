'use client';

import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="mb-8 rounded-xl border-2 border-purple-300 bg-purple-50 p-6">
      <h3 className="mb-4 text-center text-xl font-bold text-purple-700">
        {t(language, 'selectLanguage')}
      </h3>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setLanguage('bg')}
          className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${
            language === 'bg'
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg'
              : 'bg-white border-2 border-purple-300 text-purple-700 hover:border-purple-500'
          }`}
        >
          🇧🇬 {t(language, 'bulgarian')}
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${
            language === 'en'
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg'
              : 'bg-white border-2 border-purple-300 text-purple-700 hover:border-purple-500'
          }`}
        >
          🇬🇧 {t(language, 'english')}
        </button>
      </div>
    </div>
  );
}
