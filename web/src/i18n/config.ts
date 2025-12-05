export const SUPPORTED_LOCALES = ["en", "nb", "sv", "da", "de", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function detectLocale(): Locale {
  if (typeof navigator !== "undefined") {
    const lang = navigator.language?.split("-")[0];
    if (SUPPORTED_LOCALES.includes(lang as Locale)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}
