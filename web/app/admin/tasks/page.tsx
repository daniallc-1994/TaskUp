'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Task } from "../../../lib/types";

export default function AdminTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/admin/tasks", token)
      .then((res) => setTasks(res || []))
      .catch((err) => console.error("admin tasks", err));
  }, [token]);

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
          {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks loaded.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
