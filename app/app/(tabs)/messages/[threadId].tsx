import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "../../../lib/api";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { t } from "../../../lib/i18n";
import { colors } from "../../../theme";
import { trackEvent, trackError } from "../../../lib/telemetry";

type Message = { id: string; task_id: string; content: string; sender_id?: string; created_at?: string };

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const load = (nextPage = 1, append = false) => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/messages?task_id=${threadId}&page=${nextPage}&limit=${limit}`)
      .then((res) => {
        const list = res || [];
        setMessages((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= limit);
        setPage(nextPage);
        trackEvent("message.thread_opened", { source: "mobile", threadId });
      })
      .catch((err) => {
        setError(getUserFriendlyMessage(parseApiError(err), t));
        trackError(err, { source: "mobile", endpoint: "/api/messages", threadId, page: nextPage });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [threadId]);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.post("/api/messages", { task_id: threadId, content });
      setContent("");
      load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
      trackEvent("message.sent", { source: "mobile", threadId });
    } catch (err) {
      setError(getUserFriendlyMessage(parseApiError(err), t));
      trackError(err, { source: "mobile", endpoint: "/api/messages", method: "POST" });
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("messages_title")}</Text>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.msg}>
            <Text style={styles.msgBody}>{item.content}</Text>
            <Text style={styles.msgMeta}>{item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("messages_empty")}</Text> : null}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.msg} onPress={() => load(page + 1, true)} disabled={loading}>
              <Text style={{ color: colors.purple, textAlign: "center" }}>{loading ? "..." : "Load more"}</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder={t("messages_input_placeholder")}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={content}
          onChangeText={setContent}
        />
        <Pressable style={styles.sendBtn} onPress={send} disabled={sending}>
          <Text style={styles.sendText}>{t("auth_submit")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 12, gap: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  msg: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
  },
  msgBody: { color: colors.text },
  msgMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  inputRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.text,
  },
  sendBtn: { backgroundColor: colors.purple, paddingHorizontal: 12, borderRadius: 10, justifyContent: "center" },
  sendText: { color: colors.text, fontWeight: "700" },
});
