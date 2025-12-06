'use client';

import Link from "next/link";
import { useState, FormEvent } from "react";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Card } from "../../../src/components/ui/card";
import { useAuth } from "../../../lib/useAuth";
import { useI18n } from "../../../src/i18n/I18nProvider";

export default function Signup() {
  const { register, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "tasker">("client");
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await register(fullName, email, password, role);
    if (!res.ok) setError(res.message || t("errors.validation"));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white">{t("auth.signupTitle")}</h1>
        <p className="text-gray-300 text-lg">{t("dashboard.subtitle")}</p>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>- Verified taskers with ratings</li>
          <li>- Live chat and order room</li>
          <li>- Admin-backed disputes for peace of mind</li>
        </ul>
      </div>
      <Card className="p-8 border-white/15 bg-black/70">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-gray-300">{t("auth.fullName")}</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-300">{t("auth.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-300">{t("auth.password")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-300">Role</label>
            <div className="flex gap-2 mt-1">
              <Button type="button" variant={role === "client" ? "solid" : "outline"} size="sm" onClick={() => setRole("client")}>
                {t("auth.role.client")}
              </Button>
              <Button type="button" variant={role === "tasker" ? "solid" : "outline"} size="sm" onClick={() => setRole("tasker")}>
                {t("auth.role.tasker")}
              </Button>
            </div>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("wallet.loading") : t("auth.signupCta")}
          </Button>
        </form>
        <div className="text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-purple-300">
            {t("auth.loginCta")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
