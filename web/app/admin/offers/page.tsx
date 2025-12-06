'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Offer } from "../../../lib/types";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";
import { Button } from "../../../src/components/ui/button";

export default function AdminOffers() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    adminPaginated<Offer[]>("/api/admin/offers", token, page, limit)
      .then((res) => {
        setOffers(res || []);
        trackEvent("admin.offers.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/offers", page });
      });
  }, [token, page]);

  return (
    <Protected role="admin">
      <DashboardShell title="Offers" subtitle="See offers per task and moderate spam." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {offers.map((o) => (
            <Card key={o.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{(o.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{o.task_id}</div>
              </div>
              <span className="text-cyan-300">{o.status}</span>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {offers.length === 0 ? <div className="text-gray-400 text-sm">No offers loaded.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={offers.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
