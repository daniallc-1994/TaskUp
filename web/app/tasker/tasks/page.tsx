'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Task } from "../../../lib/types";

export default function TaskerTasks() {
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
      <DashboardShell title="Nearby tasks" subtitle="Within your radius and skills." variant="tasker">
        <div className="space-y-3">
          {tasks.map((t) => (
            <Card key={t.id} className="p-4 bg-white/5 border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{t.title}</h3>
                <p className="text-gray-300 text-sm">{t.budget_cents ? `${(t.budget_cents / 100).toFixed(0)} kr` : ""}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/tasks/${t.id}`}>Send offer</Link>
              </Button>
            </Card>
          ))}
          {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks available.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
