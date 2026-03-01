'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bg');
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from localStorage on client (after hydration)
  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'bg' || saved === 'en')) {
      setLanguageState(saved);
    } else {
      setLanguageState('bg'); // Default to Bulgarian
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLanguage);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default language for static rendering
    return { language: 'bg' as Language, setLanguage: () => {} };
  }
  return context;
}
