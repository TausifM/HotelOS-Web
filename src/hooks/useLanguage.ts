// FRONTEND: web/src/hooks/useLanguage.ts
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRANSLATIONS, Lang, TKey } from '@/lib/i18n';

interface LangStore {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

export const useLang = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (key) => TRANSLATIONS[get().lang][key] || TRANSLATIONS.en[key] || key,
    }),
    { name: 'stayos-lang' }
  )
);
