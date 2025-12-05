'use client';

import useSWR from "swr";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

export function useNotifications() {
  const { token } = useAuth();
  const { data, error, mutate } = useSWR(token ? ["/api/notifications", token] : null, ([url, t]) => api.get(url, t), {
    refreshInterval: 15000,
  });

  useEffect(() => {
    if (!supabase || !token) return;
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => mutate()
      )
      .subscribe();
    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [token, mutate]);

  const notifications = data || [];
  const unread = notifications.filter((n: any) => !n.is_read).length;

  return { notifications, unread, error, refresh: mutate };
}
