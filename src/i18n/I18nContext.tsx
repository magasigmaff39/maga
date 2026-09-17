import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppLanguage } from '../types';
import { translate, LANGUAGES, DICTIONARIES } from './translations';
import { getStoredLanguage, setStoredLanguage } from '../lib/api';
import { lookup, subscribe, isTranslatable } from './autoTranslate';

interface I18nValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  /**
   * Dictionary lookup by key. When the key is not in the dictionaries and looks like Russian text
   * (dynamic content, knowledge-base strings), it is auto-translated for KK/EN via the backend and
   * the original Russian is shown until the translation arrives.
   */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate a dynamic Russian string (alias of `t` that reads better at call sites). */
  tx: (text: string | undefined | null) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nValue>({
  lang: 'ru',
  setLang: () => undefined,
  t: (key) => key,
  tx: (text) => text || '',
  languages: LANGUAGES,
});

function detectInitialLanguage(): AppLanguage {
  const stored = getStoredLanguage();
  if (stored) return stored;
  try {
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('kk')) return 'kk';
    if (nav.startsWith('en')) return 'en';
  } catch {
    /* ignore */
  }
  return 'ru';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => detectInitialLanguage());
  // Bumped whenever a batch of auto-translations lands, so consumers re-render with the new strings.
  const [version, setVersion] = useState(0);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    setStoredLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const value = useMemo<I18nValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      if (lang !== 'ru' && key && DICTIONARIES[lang][key] === undefined) {
        // Not a dictionary key: treat Russian text as content to auto-translate.
        const source = DICTIONARIES.ru[key] ?? key;
        if (isTranslatable(source)) {
          const hit = lookup(lang, source);
          if (hit) return vars ? interpolate(hit, vars) : hit;
        }
      }
      return translate(lang, key, vars);
    };
    const tx = (text: string | undefined | null) => (text ? t(text) : '');
    return { lang, setLang, t, tx, languages: LANGUAGES };
    // `version` is a dependency on purpose: a new batch of auto-translations must produce a new `t`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, setLang, version]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

function interpolate(raw: string, vars: Record<string, string | number>) {
  return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function useI18n() {
  return useContext(I18nContext);
}
