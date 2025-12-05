'use client';

import { useEffect, useState } from "react";

const STORAGE_KEY = "taskup_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 z-50">
      <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div>
          <div className="text-white font-semibold">Cookies & analytics</div>
          <div className="text-sm text-gray-300">We use cookies for basic analytics and to remember your preferences.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CFF] to-[#24c0f7] text-white font-semibold"
          >
            Accept
          </button>
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white font-semibold"
          >
            Manage later
          </button>
        </div>
      </div>
    </div>
  );
}
