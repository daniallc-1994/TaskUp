'use client';

import { useEffect, useMemo, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { Payment } from "../../lib/types";
import { useI18n } from "../../src/i18n/I18nProvider";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { trackError, trackEvent } from "../../lib/telemetry";

export default function WalletPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const { t } = useI18n();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/payments?page=${page}&limit=${limit}`, token)
      .then((res) => {
        setPayments(res || []);
        trackEvent("wallet.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed, t));
        trackError(parsed, { source: "web", endpoint: "/api/payments", page });
      })
      .finally(() => setLoading(false));
  }, [token, page, t]);

  const summary = useMemo(() => {
    const escrowed = payments.filter((p) => p.status === "escrowed").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const released = payments.filter((p) => p.status === "payment_released").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const refunded = payments.filter((p) => p.status === "refunded").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    return { escrowed, released, refunded };
  }, [payments]);

  return (
    <Protected>
      <DashboardShell title={t("wallet.title")} subtitle={t("dashboard.subtitle")}>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">{t("wallet.balance")}</div>
            <div className="text-2xl font-black text-white">{(summary.escrowed / 100).toFixed(2)} kr</div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">{t("wallet.released")}</div>
            <div className="text-2xl font-black text-white">{(summary.released / 100).toFixed(2)} kr</div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">{t("wallet.refunded")}</div>
            <div className="text-2xl font-black text-white">{(summary.refunded / 100).toFixed(2)} kr</div>
          </Card>
        </div>
        <Card className="p-4 bg-white/5 border-white/10 text-sm text-gray-200">
          <div className="font-semibold text-white mb-2">{t("wallet.transactions")}</div>
          {loading ? <div className="text-gray-400">{t("wallet.loading")}</div> : null}
          {error ? <div className="text-red-400">{error}</div> : null}
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>{(p.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{t(`wallet.status.${p.status}`) || p.status}</div>
              </div>
            ))}
            {!loading && payments.length === 0 ? (
              <div className="text-gray-400 text-sm">{t("wallet.empty")}</div>
            ) : null}
          </div>
          <div className="flex gap-2 items-center mt-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={payments.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
