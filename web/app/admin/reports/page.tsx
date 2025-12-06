"use client";

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { useAuth } from "../../../lib/useAuth";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";

type Report = { id: string; reason: string; target?: string; created_at?: string; reporter?: string };

export default function AdminReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    adminPaginated<Report[]>("/api/admin/reports", token, page, limit)
      .then((res) => {
        setReports(res || []);
        trackEvent("admin.reports.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/reports", page });
      });
  }, [token, page]);

  return (
    <Protected role="admin">
      <DashboardShell title="Reports" subtitle="User and content reports to moderate." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {reports.map((r) => (
            <Card key={r.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{r.reason}</div>
                <div className="text-xs text-gray-400">{r.target}</div>
                {r.created_at ? <div className="text-xs text-gray-500">{r.created_at}</div> : null}
              </div>
              <span className="text-cyan-300">{r.reporter || r.id}</span>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {reports.length === 0 ? <div className="text-gray-400 text-sm">No reports loaded.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={reports.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
