'use client';

import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { useI18n } from "../../i18n/I18nProvider";
import { useNotifications } from "../../lib/useNotifications";

type MainShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const MainShell: React.FC<MainShellProps> = ({ children }) => {
  const { t, locale, setLocale } = useI18n();
  const { unread } = useNotifications();
  return (
    <div className="min-h-screen text-white relative" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8B5CFF]/18 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#24c0f7]/16 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <header className="relative z-10 border-b border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CFF] to-[#24c0f7] rounded-xl flex items-center justify-center font-black">
              TU
            </div>
            <div>
              <div className="text-xl font-black">TaskUp</div>
              <div className="text-xs text-purple-300 font-semibold">Norway&apos;s #1 Task Platform</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white font-semibold">
                {t(link.label)}
              </Link>
            ))}
            <select
              className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
            >
              <option value="en">EN</option>
              <option value="nb">NB</option>
              <option value="sv">SV</option>
              <option value="da">DA</option>
              <option value="de">DE</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
            <Link href="/notifications" className="relative text-gray-300 hover:text-white">
              <span className="inline-flex items-center gap-1">
                <span role="img" aria-label="notifications">
                  🔔
                </span>
                <span className="text-sm">{t("nav.notifications")}</span>
              </span>
              {unread > 0 ? (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5">
                  {unread}
                </span>
              ) : null}
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/login">{t("nav.login")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">{t("nav.signup")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 text-sm text-gray-400 flex justify-between">
          <div>© TaskUp</div>
          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
