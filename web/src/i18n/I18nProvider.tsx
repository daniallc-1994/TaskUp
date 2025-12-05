'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES, detectLocale } from "./config";
import en from "../../public/locales/en/common.json";
import nb from "../../public/locales/nb/common.json";
import sv from "../../public/locales/sv/common.json";
import da from "../../public/locales/da/common.json";
import de from "../../public/locales/de/common.json";
import fr from "../../public/locales/fr/common.json";
import es from "../../public/locales/es/common.json";

const translations: Record<Locale, Record<string, string>> = { en, nb, sv, da, de, fr, es };
const STORAGE_KEY = "taskup_locale";

type I18nCtx = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
};

const Ctx = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Locale | null) : null;
    setLocaleState(stored && SUPPORTED_LOCALES.includes(stored) ? stored : detectLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string) => translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key;

  const value = useMemo(() => ({ locale, t, setLocale }), [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
