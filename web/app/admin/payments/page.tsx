'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Payment } from "../../../lib/types";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";
import { Button } from "../../../src/components/ui/button";

export default function AdminPayments() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    adminPaginated<Payment[]>("/api/admin/payments", token, page, limit)
      .then((res) => {
        setPayments(res || []);
        trackEvent("admin.payments.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/payments", page });
      });
  }, [token, page]);

  return (
    <Protected role="admin">
      <DashboardShell title="Payments" subtitle="View escrow, released, and refunded payments." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {payments.map((p) => (
            <Card key={p.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{(p.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{p.id}</div>
              </div>
              <span className="text-cyan-300">{p.status}</span>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {payments.length === 0 ? <div className="text-gray-400 text-sm">No payments loaded.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={payments.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
