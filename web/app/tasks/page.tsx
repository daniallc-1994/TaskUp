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

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/tasks", token)
      .then((res) => setTasks(res || []))
      .catch((err) => console.error("tasks load", err));
  }, [token]);

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
                  {task.budget_cents ? `${(task.budget_cents / 100).toFixed(0)} kr` : "—"}
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/orders/${task.id}`}>Open order</Link>
                </Button>
              </div>
            </Card>
          ))}
          {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks yet.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
