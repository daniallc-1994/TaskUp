'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";

export default function AdminPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<{ users?: number; tasks?: number; offers?: number; disputes?: number; payments?: number }>({});

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/admin/metrics", token)
      .then(setMetrics)
      .catch((err) => console.error("admin metrics", err));
  }, [token]);

  const metricList = [
    { label: "Users", value: metrics.users ?? 0 },
    { label: "Tasks", value: metrics.tasks ?? 0 },
    { label: "Offers", value: metrics.offers ?? 0 },
    { label: "Disputes", value: metrics.disputes ?? 0 },
    { label: "Payments", value: metrics.payments ?? 0 },
  ];

  return (
    <Protected role="admin">
      <DashboardShell title="Admin" subtitle="Moderate users, tasks, offers, disputes, and payments." variant="admin">
        <div className="grid md:grid-cols-5 gap-4">
          {metricList.map((m) => (
            <Card key={m.label} className="p-4 bg-white/5 border-white/10">
              <div className="text-sm text-gray-300">{m.label}</div>
              <div className="text-xl font-black text-white">{m.value}</div>
            </Card>
          ))}
        </div>
        <Card className="p-4 bg-white/5 border-white/10 text-sm text-gray-200">
          Use the sidebar to jump to Users, Tasks, Offers, Disputes, Payments, Reports, Logs, and Analytics.
        </Card>
      </DashboardShell>
    </Protected>
  );
}
