'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Dispute } from "../../../lib/types";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";

export default function AdminDisputes() {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setError(null);
    adminPaginated<Dispute[]>("/api/admin/disputes", token, page, limit)
      .then((res) => {
        setDisputes(res || []);
        trackEvent("admin.disputes.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/disputes", page });
      });
  };

  useEffect(() => {
    load();
  }, [token, page]);

  const resolve = async (id: string, resolution: "release" | "refund") => {
    try {
      await api.post(`/api/disputes/${id}/resolve`, { resolution }, token!);
      trackEvent("admin.disputes.resolved", { source: "web", disputeId: id, resolution });
      load();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserFriendlyMessage(parsed));
      trackError(parsed, { source: "web", endpoint: "/api/disputes/resolve", disputeId: id });
    }
  };

  return (
    <Protected role="admin">
      <DashboardShell title="Disputes" subtitle="Resolve by releasing or refunding escrow." variant="admin">
        <div className="space-y-3 text-sm text-gray-200">
          {disputes.map((d) => (
            <Card key={d.id} className="p-3 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{d.reason}</div>
                  <div className="text-xs text-gray-400">{d.id}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "release")}>
                    Release
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "refund")}>
                    Refund
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{d.status}</div>
            </Card>
          ))}
          {disputes.length === 0 ? <div className="text-gray-400 text-sm">No disputes loaded.</div> : null}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={disputes.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
