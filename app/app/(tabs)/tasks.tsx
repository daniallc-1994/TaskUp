'use client';

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { api } from "../../lib/api";
import { colors } from "../../theme";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";
import { trackEvent, trackError } from "../../lib/telemetry";

type Task = { id: string; title: string; status: string; budget_cents?: number; currency?: string };

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const load = (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    api
      .get(`/api/tasks/my?page=${nextPage}&limit=${limit}`)
      .then((res) => {
        const list = res || [];
        setHasMore(list.length >= limit);
        setPage(nextPage);
        setTasks((prev) => (append ? [...prev, ...list] : list));
      })
      .catch((err) => {
        setError(getUserFriendlyMessage(parseApiError(err), t));
        trackError(err, { source: "mobile", endpoint: "/api/tasks/my", page: nextPage });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/tasks", {
        title,
        description: desc,
        budget_cents: budget ? parseInt(budget, 10) * 100 : undefined,
        currency: "NOK",
      });
      trackEvent("task.created", { source: "mobile", taskId: res?.id });
      setTitle("");
      setBudget("");
      setDesc("");
      load();
    } catch (err) {
      setError(getUserFriendlyMessage(parseApiError(err), t));
      trackError(err, { source: "mobile", endpoint: "/api/tasks", method: "POST" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("tasks_title")}</Text>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/tasks/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.status}</Text>
              <Text style={styles.cardMeta}>
                {item.budget_cents ? `${(item.budget_cents / 100).toFixed(0)} ${item.currency || "NOK"}` : ""}
              </Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("tasks_empty")}</Text> : null}
        style={{ marginTop: 12 }}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={[styles.button, { marginTop: 8 }]} onPress={() => load(page + 1, true)} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "..." : "Load more"}</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={styles.form}>
        <Text style={styles.subtitle}>{t("tasks_create")}</Text>
        <TextInput placeholder={t("tasks_title")} placeholderTextColor={colors.muted} style={styles.input} value={title} onChangeText={setTitle} />
        <TextInput placeholder={t("tasks_budget")} placeholderTextColor={colors.muted} style={styles.input} value={budget} onChangeText={setBudget} />
        <TextInput
          placeholder={t("tasks_details")}
          placeholderTextColor={colors.muted}
          style={[styles.input, { height: 80 }]}
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <Pressable style={styles.button} onPress={createTask} disabled={loading}>
          <Text style={styles.buttonText}>{t("tasks_create")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, marginBottom: 6 },
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
  form: { marginTop: 12, gap: 8 },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  button: { backgroundColor: colors.purple, padding: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.text, fontWeight: "700" },
});
