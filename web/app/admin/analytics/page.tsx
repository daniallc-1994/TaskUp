"use client";

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";

type Metric = { label: string; value: string | number };

export default function AdminAnalytics() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    api
      .get("/api/admin/analytics", token)
      .then((res) => {
        const list: Metric[] = Array.isArray(res) ? res : Object.entries(res || {}).map(([label, value]) => ({ label, value }));
        setMetrics(list);
        trackEvent("admin.analytics.viewed", { source: "web" });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/analytics" });
      });
  }, [token]);

  return (
    <Protected role="admin">
      <DashboardShell title="Analytics" subtitle="High-level overview of platform metrics." variant="admin">
        <div className="grid md:grid-cols-3 gap-4">
          {metrics.map((a) => (
            <Card key={a.label} className="p-4 bg-white/5 border-white/10">
              <div className="text-sm text-gray-300">{a.label}</div>
              <div className="text-xl font-black text-white">{a.value}</div>
            </Card>
          ))}
          {metrics.length === 0 ? <div className="text-gray-400 text-sm">No analytics available.</div> : null}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
