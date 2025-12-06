'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Task } from "../../../lib/types";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";
import { Button } from "../../../src/components/ui/button";

export default function AdminTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    adminPaginated<Task[]>("/api/admin/tasks", token, page, limit)
      .then((res) => {
        setTasks(res || []);
        trackEvent("admin.tasks.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/tasks", page });
      });
  }, [token, page]);

  return (
    <Protected role="admin">
      <DashboardShell title="Tasks" subtitle="Moderate tasks, deactivate spam, view offers and chat." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {tasks.map((t) => (
            <Card key={t.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{t.title}</div>
                <div className="text-xs text-gray-400">{t.id}</div>
              </div>
              <span className="text-cyan-300">{t.status}</span>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks loaded.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={tasks.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
