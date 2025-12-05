'use client';

import useSWR from "swr";
import { useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { useI18n } from "../../../src/i18n/I18nProvider";

export default function MessageThreadPage({ params }: { params: { threadId: string } }) {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR(
    token ? `/api/messages?task_id=${params.threadId}` : null,
    (url) => api.get(url, token || undefined),
    { refreshInterval: 5000 }
  );
  const { data: task } = useSWR(token ? `/api/tasks/${params.threadId}` : null, (url) => api.get(url, token || undefined), {
    refreshInterval: 10000,
  });

  const send = async () => {
    if (!token || !content.trim()) return;
    setError(null);
    try {
      await api.post(
        "/api/messages",
        {
          task_id: params.threadId,
          sender_id: user?.id,
          recipient_id: user?.id === task?.client_id ? task?.assigned_tasker_id : task?.client_id,
          body: content,
        },
        token
      );
      setContent("");
      mutate();
    } catch (err: any) {
      const parsed = parseApiError(err?.apiError || err);
      setError(getUserFriendlyMessage(parsed));
    }
  };

  return (
    <Protected>
      <DashboardShell title={t("messages.title")} subtitle={t("messages.subtitle") || "Chat with your task partner."}>
        <Card className="p-4 bg-white/5 border-white/10 space-y-3">
          {isLoading ? <div className="text-gray-400 text-sm">{t("messages.loading") || "Loading conversation..."}</div> : null}
          {error ? <div className="text-red-300 text-sm">{error}</div> : null}
          {!isLoading && !data?.length ? <div className="text-gray-400 text-sm">{t("messages.empty")}</div> : null}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {(data || []).map((m: any) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl ${m.sender_id === user?.id ? "bg-purple-500/20 ml-auto" : "bg-white/5"}`}
                style={{ maxWidth: "90%" }}
              >
                <div className="text-xs text-gray-300">{new Date(m.created_at).toLocaleString()}</div>
                <div className="text-sm text-white whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("tasker.offerMessage")} />
            <Button onClick={send}>{t("messages.send") || "Send"}</Button>
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
