"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from '@/fhevm/internal/translations';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tEn: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [language, setLanguageState] = useState<Language>('zh');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('medrec-language') as Language;
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('medrec-language', lang);
  };

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] ? current[key] : '';
    }, obj);
  };

  const t = (key: string): string => {
    const translation = getNestedValue(translations[language], key);
    return translation || key;
  };

  const tEn = (key: string): string => {
    const enTranslation = getNestedValue(translations.en, key);
    return enTranslation || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, tEn }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Helper function to get translated text with bilingual display
export const getBilingualText = (primaryText: string, secondaryText: string, language: Language) => {
  if (language === 'zh') {
    return (
      <div className="space-y-1">
        <div className="text-base font-medium text-gray-900">{primaryText}</div>
        <div className="text-sm text-gray-600">{secondaryText}</div>
      </div>
    );
  } else {
    return (
      <div className="space-y-1">
        <div className="text-base font-medium text-gray-900">{primaryText}</div>
        <div className="text-sm text-gray-600">{secondaryText}</div>
      </div>
    );
  }
};

