'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../lib/api";

type Flags = Record<string, boolean>;

type FeatureFlagsCtx = {
  flags: Flags;
  environment: string;
  refresh: () => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsCtx | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Flags>({});
  const [environment, setEnv] = useState("development");

  const load = () => {
    api
      .get("/api/config")
      .then((res) => {
        setFlags(res?.data?.feature_flags || {});
        setEnv(res?.data?.environment || "development");
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  return <FeatureFlagsContext.Provider value={{ flags, environment, refresh: load }}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  return ctx;
}
