'use client';

import useSWR from "swr";
import { api } from "../../lib/api";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { useAuth } from "../../lib/useAuth";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { useI18n } from "../../src/i18n/I18nProvider";

const fetcher = (url: string, token?: string) => api.get(url, token);

export default function NotificationsPage() {
  const { token } = useAuth();
  const { data, mutate } = useSWR(token ? ["/api/notifications", token] : null, ([url, t]) => fetcher(url, t));
  const { t } = useI18n();

  const markRead = async (id: string) => {
    if (!token) return;
    try {
      await api.post(`/api/notifications/${id}/read`, {}, token);
      mutate();
    } catch (err: any) {
      const parsed = parseApiError(err?.apiError || err);
      alert(getUserFriendlyMessage(parsed));
    }
  };

  return (
    <Protected>
      <DashboardShell title={t("notifications.title")} subtitle={t("notifications.subtitle") || "Latest alerts and updates."}>
        <div className="space-y-3">
          {(data || []).map((n: any) => (
            <Card key={n.id} className="p-4 bg-black/60 border-white/10 flex justify-between items-start gap-3">
              <div>
                <div className="text-white font-semibold">{n.title}</div>
                <div className="text-sm text-gray-300">{n.body}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {!n.is_read && <Badge>{t("notifications.new") || "New"}</Badge>}
                {!n.is_read ? (
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                    {t("notifications.markRead") || "Mark read"}
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
          {!data?.length && <div className="text-sm text-gray-400">{t("notifications.empty")}</div>}
        </div>
      </DashboardShell>
    </Protected>
  );
}
