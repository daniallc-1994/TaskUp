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

export default function TaskerHome() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/tasks", token)
      .then((res) => setTasks(res || []))
      .catch((err) => console.error("tasker tasks", err));
  }, [token]);

  return (
    <Protected>
      <DashboardShell
        title="Tasker home"
        subtitle="See nearby tasks, manage availability, and respond quickly."
        variant="tasker"
        actions={
          <Button asChild>
            <Link href="/tasker/tasks">Browse tasks</Link>
          </Button>
        }
      >
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="font-semibold text-white mb-3">Nearby tasks</div>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                <div>
                  <div className="font-semibold text-white">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-purple-200 font-semibold">
                    {t.budget_cents ? `${(t.budget_cents / 100).toFixed(0)} kr` : ""}
                  </div>
                  <Button variant="outline" size="sm">
                    Send offer
                  </Button>
                </div>
              </div>
            ))}
            {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks available.</div> : null}
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
