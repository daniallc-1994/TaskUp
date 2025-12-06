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
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { useI18n } from "../../src/i18n/I18nProvider";
import { trackError, trackEvent } from "../../lib/telemetry";

type Thread = { task: Task; last?: Message };

export default function MessagesPage() {
  const { token } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!token) return;
    setError(null);
    api
      .get(`/api/tasks?page=${page}&limit=${limit}`, token)
      .then(async (tasks: Task[]) => {
        const results: Thread[] = [];
        for (const t of tasks || []) {
          const msgs: Message[] = await api.get(`/api/messages?task_id=${t.id}&limit=20`, token).catch(() => []);
          results.push({ task: t, last: msgs[msgs.length - 1] });
        }
        setThreads(results);
        trackEvent("messages.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed, t));
        trackError(parsed, { source: "web", endpoint: "/api/tasks", page });
      });
  }, [token, page, t]);

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
          {error ? <div className="text-red-400 text-sm">{error}</div> : null}
          {threads.length === 0 ? <div className="text-gray-400 text-sm">No conversations yet.</div> : null}
          <div className="flex gap-2 items-center">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-gray-300 text-sm">Page {page}</div>
            <Button variant="outline" disabled={threads.length < limit} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
