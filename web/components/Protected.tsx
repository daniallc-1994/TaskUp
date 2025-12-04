'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/useAuth";

export function Protected({ children, role }: { children: React.ReactNode; role?: string }) {
  const { token, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth/login");
    } else if (!loading && role && user?.role !== role && role === "admin") {
      router.replace("/dashboard");
    }
  }, [loading, token, router, role, user?.role]);

  if (loading || !token) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return <>{children}</>;
}
