'use client';

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../../lib/useAuth";
import { api } from "../../lib/api";

const STORAGE_KEY = "taskup_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t, locale } = useI18n();
  const { token } = useAuth();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) setVisible(true);
  }, []);

  const persistDecision = async (decision: "accepted" | "rejected" | "later") => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, decision);
    setVisible(false);
    try {
      await api.post(
        "/api/privacy/consent",
        { decision, locale, timestamp: new Date().toISOString() },
        token || undefined
      );
    } catch {
      /* consent logging is best-effort */
    }
  };

  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 z-50">
      <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div>
          <div className="text-white font-semibold">{t("cookie.title")}</div>
          <div className="text-sm text-gray-300">{t("cookie.message")}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => persistDecision("accepted")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CFF] to-[#24c0f7] text-white font-semibold"
          >
            {t("cookie.accept")}
          </button>
          <button
            onClick={() => persistDecision("rejected")}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white font-semibold"
          >
            {t("cookie.reject")}
          </button>
          <button
            onClick={() => persistDecision("later")}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white font-semibold"
          >
            {t("cookie.manage")}
          </button>
        </div>
      </div>
    </div>
  );
}
