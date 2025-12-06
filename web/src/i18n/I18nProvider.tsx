'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES, detectLocale } from "./config";
import enCommon from "../../public/locales/en/common.json";
import nbCommon from "../../public/locales/nb/common.json";
import svCommon from "../../public/locales/sv/common.json";
import daCommon from "../../public/locales/da/common.json";
import deCommon from "../../public/locales/de/common.json";
import frCommon from "../../public/locales/fr/common.json";
import esCommon from "../../public/locales/es/common.json";
import enDashboard from "../../public/locales/en/dashboard.json";
import nbDashboard from "../../public/locales/nb/dashboard.json";
import svDashboard from "../../public/locales/sv/dashboard.json";
import daDashboard from "../../public/locales/da/dashboard.json";
import deDashboard from "../../public/locales/de/dashboard.json";
import frDashboard from "../../public/locales/fr/dashboard.json";
import esDashboard from "../../public/locales/es/dashboard.json";
import enSeo from "../../public/locales/en/seo.json";
import nbSeo from "../../public/locales/nb/seo.json";
import svSeo from "../../public/locales/sv/seo.json";
import daSeo from "../../public/locales/da/seo.json";
import deSeo from "../../public/locales/de/seo.json";
import frSeo from "../../public/locales/fr/seo.json";
import esSeo from "../../public/locales/es/seo.json";

const merge = (...objs: Record<string, string>[]) => Object.assign({}, ...objs);

const translations: Record<Locale, Record<string, string>> = {
  en: merge(enCommon, enDashboard, enSeo),
  nb: merge(nbCommon, nbDashboard, nbSeo),
  sv: merge(svCommon, svDashboard, svSeo),
  da: merge(daCommon, daDashboard, daSeo),
  de: merge(deCommon, deDashboard, deSeo),
  fr: merge(frCommon, frDashboard, frSeo),
  es: merge(esCommon, esDashboard, esSeo),
};
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
