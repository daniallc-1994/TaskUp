import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList } from "react-native";
import { api } from "../../lib/api";
import { colors } from "../../theme";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";
import { trackEvent, trackError } from "../../lib/telemetry";

type Offer = { id: string; task_id: string; amount_cents: number; status: string };
type Task = { id: string; title: string; budget_cents?: number; currency?: string; status: string };

export default function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const load = (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/api/offers"), api.get(`/api/tasks?status=open&page=${nextPage}&limit=${limit}`)])
      .then(([offersRes, tasksRes]) => {
        setOffers(offersRes || []);
        const list = tasksRes || [];
        setAvailableTasks((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= limit);
        setPage(nextPage);
      })
      .catch((err) => {
        setError(getUserFriendlyMessage(parseApiError(err), t));
        trackError(err, { source: "mobile", endpoint: "/api/tasks", page: nextPage });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const createOffer = async () => {
    if (!taskId || !amount) return;
    try {
      const res = await api.post("/api/offers", {
        task_id: taskId,
        amount_cents: parseInt(amount, 10) * 100,
        message: message || "Offer from mobile",
      });
      trackEvent("task.offer_sent", { source: "mobile", taskId, offerId: res?.id });
      setTaskId("");
      setAmount("");
      setMessage("");
      load();
    } catch (err) {
      setError(getUserFriendlyMessage(parseApiError(err), t));
      trackError(err, { source: "mobile", endpoint: "/api/offers", method: "POST" });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("offers_available")}</Text>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <FlatList
        data={availableTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setTaskId(item.id)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.status}</Text>
            <Text style={styles.cardMeta}>
              {item.budget_cents ? `${(item.budget_cents / 100).toFixed(0)} ${item.currency || "NOK"}` : ""}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.cyan }]}>Tap to select</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("tasks_empty")}</Text> : null}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={[styles.button, { marginBottom: 12 }]} onPress={() => load(page + 1, true)} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "..." : "Load more"}</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.form}>
        <Text style={styles.subtitle}>{t("offers_send")}</Text>
        <TextInput
          placeholder="Task ID"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={taskId}
          onChangeText={setTaskId}
        />
        <TextInput placeholder={t("offers_amount")} placeholderTextColor={colors.muted} style={styles.input} value={amount} onChangeText={setAmount} />
        <TextInput
          placeholder={t("offers_message")}
          placeholderTextColor={colors.muted}
          style={[styles.input, { height: 70 }]}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable style={styles.button} onPress={createOffer} disabled={loading}>
          <Text style={styles.buttonText}>{t("offers_send")}</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>{t("nav_offers")}</Text>
      {offers.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.cardTitle}>{(o.amount_cents / 100).toFixed(0)} kr</Text>
          <Text style={styles.cardMeta}>{o.task_id}</Text>
          <Text style={styles.cardMeta}>{o.status}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, marginTop: 8 },
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
