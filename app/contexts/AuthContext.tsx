'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { saveToken, loadToken, clearToken } from "../lib/storage";
import { parseApiError, getUserFriendlyMessage } from "../lib/apiErrors";
import { t as translate } from "../lib/i18n";
import { trackEvent, trackError } from "../lib/telemetry";

type User = { id?: string; email: string; full_name?: string; role?: string } | null;

type AuthContextShape = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (payload: { full_name: string; email: string; password: string; role: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (stored) {
        setToken(stored);
        setAuthToken(stored);
        try {
          const me = await api.get("/api/auth/me", stored);
          setUser(me?.user || me || null);
        } catch {
          await clearToken();
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (nextUser: User, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    setAuthToken(nextToken || undefined);
    if (nextToken) {
      await saveToken(nextToken);
    } else {
      await clearToken();
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const tok = res?.access_token || res?.token;
      await persist(res?.user || res, tok || null);
      trackEvent("auth.login_success", { source: "mobile" });
      return { ok: true };
    } catch (err) {
      const parsed = parseApiError(err);
      trackEvent("auth.login_failed", { source: "mobile", code: parsed.error.code });
      trackError(err, { source: "mobile", endpoint: "/api/auth/login", method: "POST" });
      return { ok: false, error: getUserFriendlyMessage(parsed, translate) };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: { full_name: string; email: string; password: string; role: string }) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", payload);
      const tok = res?.access_token || res?.token;
      await persist(res?.user || res, tok || null);
      trackEvent("auth.signup_success", { source: "mobile", role: payload.role });
      return { ok: true };
    } catch (err) {
      const parsed = parseApiError(err);
      trackEvent("auth.signup_failed", { source: "mobile", code: parsed.error.code });
      trackError(err, { source: "mobile", endpoint: "/api/auth/register", method: "POST" });
      return { ok: false, error: getUserFriendlyMessage(parsed, translate) };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await persist(null, null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
