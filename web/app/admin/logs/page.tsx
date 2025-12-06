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

type AdminLog = { id: string; action: string; actor?: string; target_id?: string; created_at?: string; ip?: string };

export default function AdminLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    adminPaginated<AdminLog[]>("/api/admin/logs", token, page, limit)
      .then((res) => {
        setLogs(res || []);
        trackEvent("admin.logs.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/logs", page });
      });
  }, [token, page]);

  return (
    <Protected role="admin">
      <DashboardShell title="Admin logs" subtitle="Every sensitive action is audited." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {logs.map((l) => (
            <Card key={l.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{l.action}</div>
                <div className="text-xs text-gray-400">{l.id}</div>
                {l.target_id ? <div className="text-xs text-gray-400">Target: {l.target_id}</div> : null}
                {l.created_at ? <div className="text-xs text-gray-500">{l.created_at}</div> : null}
              </div>
              <span className="text-cyan-300">{l.actor || l.ip || "admin"}</span>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {logs.length === 0 ? <div className="text-gray-400 text-sm">No logs loaded.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={logs.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
