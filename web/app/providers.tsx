'use client';

import React from "react";
import { AuthProvider } from "../lib/useAuth";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { FeatureFlagsProvider } from "../src/lib/featureFlags";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <FeatureFlagsProvider>
        <AuthProvider>{children}</AuthProvider>
      </FeatureFlagsProvider>
    </I18nProvider>
  );
}
