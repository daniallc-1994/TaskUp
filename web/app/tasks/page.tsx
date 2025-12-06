'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { Task } from "../../lib/types";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { trackError, trackEvent } from "../../lib/telemetry";
import { useI18n } from "../../src/i18n/I18nProvider";

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!token) return;
    setError(null);
    api
      .get(`/api/tasks?page=${page}&limit=${limit}`, token)
      .then((res) => {
        setTasks(res || []);
        trackEvent("tasks.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed, t));
        trackError(parsed, { source: "web", endpoint: "/api/tasks", page });
      });
  }, [token, page, t]);

  return (
    <Protected>
      <DashboardShell
        title="Tasks"
        subtitle="See incoming offers and open the order room."
        actions={
          <Button asChild>
            <Link href="/tasks/new">New task</Link>
          </Button>
        }
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4 bg-white/5 border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-white">{task.title}</div>
                <div className="text-xs text-gray-400">Status: {task.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-white">
                  {task.budget_cents ? `${(task.budget_cents / 100).toFixed(0)} kr` : "--"}
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/orders/${task.id}`}>Open order</Link>
                </Button>
              </div>
            </Card>
          ))}
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks yet.</div> : null}
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
