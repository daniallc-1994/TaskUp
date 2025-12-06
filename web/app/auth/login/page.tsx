'use client';

import Link from "next/link";
import { useState, FormEvent } from "react";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Card } from "../../../src/components/ui/card";
import { useAuth } from "../../../lib/useAuth";
import { useI18n } from "../../../src/i18n/I18nProvider";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (!res.ok) setError(res.message || t("errors.unauthorized"));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white">{t("auth.loginTitle")}</h1>
        <p className="text-gray-300 text-lg">{t("landing.subheadline")}</p>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>- {t("tasks.status.offers_incoming")}</li>
          <li>- {t("wallet.status.escrowed")}</li>
          <li>- {t("messages.subtitle")}</li>
        </ul>
      </div>
      <Card className="p-8 border-white/15 bg-black/70">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-gray-300">{t("auth.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-300">{t("auth.password")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("wallet.loading") : t("auth.loginCta")}
          </Button>
        </form>
        <div className="flex justify-between text-sm text-gray-400 mt-4">
          <Link href="/auth/forgot-password" className="text-purple-300">
            {t("auth.forgot")}
          </Link>
          <Link href="/auth/signup" className="text-purple-300">
            {t("auth.createAccount")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
