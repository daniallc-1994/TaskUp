'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { Message, Task } from "../../lib/types";

export default function MessagesPage() {
  const { token } = useAuth();
  const [threads, setThreads] = useState<{ task: Task; last?: Message }[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/tasks", token)
      .then(async (tasks: Task[]) => {
        const results: { task: Task; last?: Message }[] = [];
        for (const t of tasks || []) {
          const msgs: Message[] = await api.get(`/api/messages?task_id=${t.id}`, token).catch(() => []);
          results.push({ task: t, last: msgs[msgs.length - 1] });
        }
        setThreads(results);
      })
      .catch((err) => console.error(err));
  }, [token]);

  return (
    <Protected>
      <DashboardShell title="Messages" subtitle="Chat with clients/taskers and jump into order rooms.">
        <div className="space-y-3">
          {threads.map((t) => (
            <Card key={t.task.id} className="p-4 bg-white/5 border-white/10 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{t.task.title}</div>
                <div className="text-gray-300 text-sm">{t.last?.body ?? "No messages yet"}</div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <Link href={`/orders/${t.task.id}`}>Open chat</Link>
                </Button>
              </div>
            </Card>
          ))}
          {threads.length === 0 ? <div className="text-gray-400 text-sm">No conversations yet.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
