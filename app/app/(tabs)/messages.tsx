import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";
import { colors } from "../../theme";
import { trackEvent, trackError } from "../../lib/telemetry";

type Message = { id: string; task_id: string; content: string; sender_id?: string; created_at?: string };

export default function MessagesTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  const router = useRouter();

  const load = (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    api
      .get(`/api/messages?page=${nextPage}&limit=${limit}`)
      .then((res) => {
        const list = res || [];
        setPage(nextPage);
        setMessages((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= limit);
        trackEvent("messages.viewed", { source: "mobile", page: nextPage });
      })
      .catch((err) => {
        setError(getUserFriendlyMessage(parseApiError(err), t));
        trackError(err, { source: "mobile", endpoint: "/api/messages", page: nextPage });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const threads = useMemo(() => {
    const grouped: Record<string, Message[]> = {};
    messages.forEach((m) => {
      if (!grouped[m.task_id]) grouped[m.task_id] = [];
      grouped[m.task_id].push(m);
    });
    return Object.keys(grouped).map((taskId) => {
      const threadMessages = grouped[taskId].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
      return { taskId, last: threadMessages[threadMessages.length - 1] };
    });
  }, [messages]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("messages_title")}</Text>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <FlatList
        data={threads}
        keyExtractor={(item) => item.taskId}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/messages/${item.taskId}`)}>
            <Text style={styles.cardTitle}>{t("tasks_title") + " #" + item.taskId}</Text>
            <Text style={styles.cardMeta} numberOfLines={2}>
              {item.last?.content}
            </Text>
            <Text style={styles.cardMeta}>{item.last?.created_at ? new Date(item.last.created_at).toLocaleString() : ""}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("messages_empty")}</Text> : null}
        ListFooterComponent={
          messages.length >= limit ? (
            <Pressable style={styles.card} onPress={() => load(page + 1, true)} disabled={loading}>
              <Text style={{ color: colors.purple, textAlign: "center" }}>{loading ? "..." : "Load more"}</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { color: colors.text, fontWeight: "700" },
  cardMeta: { color: colors.muted, fontSize: 12 },
});
