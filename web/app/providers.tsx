'use client';

import React from "react";
import { AuthProvider } from "../lib/useAuth";
import { I18nProvider } from "../src/i18n/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
