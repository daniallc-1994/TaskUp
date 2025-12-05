'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

type User = { id?: string; email: string; full_name?: string; role?: string } | null;

type AuthContextShape = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (full_name: string, email: string, password: string, role?: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);
const STORAGE_KEY = "taskup_auth_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let parsed: any = null;
      if (raw) {
        parsed = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      }
      if (parsed?.token) {
        api
          .get("/api/auth/me", parsed.token)
          .then((res) => {
            if (res?.user) {
              persist(res.user, parsed.token);
            }
          })
          .catch(() => {});
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (nextUser: User, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      persist(res.user ?? res, res.access_token || res.token || null);
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: (err as any)?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (full_name: string, email: string, password: string, role = "client") => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        full_name,
        name: full_name,
        email,
        password,
        role,
        language: "en",
      });
      persist(res.user ?? res, res.access_token || res.token || null);
      return { ok: true };
    } catch (err) {
      console.error(err);
      const rawMessage = (err as any)?.message || "Signup failed";
      const normalized =
        rawMessage.toLowerCase().includes("exist") || rawMessage.toLowerCase().includes("already")
          ? "Email already in use"
          : rawMessage;
      return { ok: false, message: normalized };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => persist(null, null);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
