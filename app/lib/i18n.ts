import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";

export type Locale = "en" | "nb" | "sv" | "da" | "de" | "fr" | "es";
const STORAGE_KEY = "taskup_locale";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "auth.loginTitle": "Sign in",
    "auth.signupTitle": "Create account",
    "home.headline": "Get any task done fast",
    "home.cta": "View tasks",
    "tasks.title": "Your tasks",
    "wallet.title": "Wallet"
  },
  nb: { "auth.loginTitle": "Logg inn", "auth.signupTitle": "Registrer", "home.headline": "Få oppgaver gjort raskt", "home.cta": "Se oppgaver", "tasks.title": "Dine oppgaver", "wallet.title": "Lommebok" },
  sv: { "auth.loginTitle": "Logga in", "auth.signupTitle": "Registrera", "home.headline": "Få uppgifter gjorda snabbt", "home.cta": "Visa uppgifter", "tasks.title": "Dina uppgifter", "wallet.title": "Plånbok" },
  da: { "auth.loginTitle": "Log ind", "auth.signupTitle": "Registrer", "home.headline": "Få opgaver udført hurtigt", "home.cta": "Se opgaver", "tasks.title": "Dine opgaver", "wallet.title": "Pung" },
  de: { "auth.loginTitle": "Anmelden", "auth.signupTitle": "Registrieren", "home.headline": "Aufgaben schnell erledigen", "home.cta": "Aufgaben ansehen", "tasks.title": "Deine Aufgaben", "wallet.title": "Wallet" },
  fr: { "auth.loginTitle": "Se connecter", "auth.signupTitle": "Créer un compte", "home.headline": "Terminez vos tâches rapidement", "home.cta": "Voir les tâches", "tasks.title": "Vos tâches", "wallet.title": "Portefeuille" },
  es: { "auth.loginTitle": "Iniciar sesión", "auth.signupTitle": "Crear cuenta", "home.headline": "Haz cualquier tarea rápido", "home.cta": "Ver tareas", "tasks.title": "Tus tareas", "wallet.title": "Billetera" }
};

export function useI18nApp() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((l) => {
      if (l && (translations as any)[l]) setLocale(l as Locale);
    });
  }, []);
  const t = (key: string) => translations[locale]?.[key] || translations.en[key] || key;
  const changeLocale = async (l: Locale) => {
    setLocale(l);
    await AsyncStorage.setItem(STORAGE_KEY, l);
  };
  return { locale, t, changeLocale, colors };
}
