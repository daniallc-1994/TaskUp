import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../../lib/api";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { t } from "../../../lib/i18n";
import { colors } from "../../../theme";

type Offer = { id: string; amount_cents: number; status: string; tasker_id?: string; message?: string };
type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  budget_cents?: number;
  currency?: string;
  offers?: Offer[];
  accepted_offer_id?: string;
  payment_status?: string;
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const load = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/tasks/${id}`)
      .then((res) => setTask(res))
      .catch((err) => setError(getUserFriendlyMessage(parseApiError(err), t)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const acceptOffer = async (offerId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/api/offers/${offerId}/accept`);
      load();
      Alert.alert(t("toasts_offer_sent"), t("tasks_accept_offer"));
    } catch (err) {
      Alert.alert("Error", getUserFriendlyMessage(parseApiError(err), t));
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (next: string) => {
    setActionLoading(true);
    try {
      await api.post(`/api/tasks/${id}/status`, { status: next });
      load();
      Alert.alert(t("tasks_status"), next);
    } catch (err) {
      Alert.alert("Error", getUserFriendlyMessage(parseApiError(err), t));
    } finally {
      setActionLoading(false);
    }
  };

  const openDispute = async () => {
    if (!disputeReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post("/api/disputes", { task_id: id, reason: disputeReason, description: disputeReason });
      setDisputeReason("");
      load();
      Alert.alert(t("disputes_title"), t("toasts_dispute_opened"));
    } catch (err) {
      Alert.alert("Error", getUserFriendlyMessage(parseApiError(err), t));
    } finally {
      setActionLoading(false);
    }
  };

  const goMessages = () => router.push(`/messages/${id}`);

  return (
    <ScrollView style={styles.container}>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      {task ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.meta}>{task.description}</Text>
          <Text style={styles.meta}>
            {t("tasks_status")}: {task.status} · {t("tasks_budget")}:{" "}
            {task.budget_cents ? `${(task.budget_cents / 100).toFixed(0)} ${task.currency || "NOK"}` : "-"}
          </Text>
          {task.payment_status ? <Text style={styles.meta}>Escrow: {task.payment_status}</Text> : null}

          <Pressable style={styles.button} onPress={goMessages}>
            <Text style={styles.buttonText}>{t("tasks_view_messages")}</Text>
          </Pressable>

          <Text style={styles.section}>{t("tasks_view_offers")}</Text>
          {(task.offers || []).map((offer) => (
            <View key={offer.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {(offer.amount_cents / 100).toFixed(0)} {task.currency || "NOK"}
              </Text>
              <Text style={styles.cardMeta}>{offer.status}</Text>
              {offer.message ? <Text style={styles.cardMeta}>{offer.message}</Text> : null}
              <Pressable
                style={[styles.button, { backgroundColor: colors.cyan }]}
                onPress={() => acceptOffer(offer.id)}
                disabled={actionLoading}
              >
                <Text style={styles.buttonText}>{t("tasks_accept_offer")}</Text>
              </Pressable>
            </View>
          ))}

          <View style={{ gap: 8, marginTop: 12 }}>
            <Pressable style={styles.button} onPress={() => updateStatus("awaiting_client_confirmation")} disabled={actionLoading}>
              <Text style={styles.buttonText}>{t("tasks_mark_done")}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => updateStatus("completed")} disabled={actionLoading}>
              <Text style={styles.buttonText}>{t("tasks_confirm")}</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 16, gap: 6 }}>
            <Text style={styles.section}>{t("disputes_open")}</Text>
            <TextInput
              placeholder={t("disputes_reason")}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <Pressable style={[styles.button, { backgroundColor: colors.glass, borderColor: colors.border, borderWidth: 1 }]} onPress={openDispute}>
              <Text style={styles.buttonText}>{t("tasks_open_dispute")}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  meta: { color: colors.muted, marginTop: 4 },
  section: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 12 },
  button: { backgroundColor: colors.purple, padding: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.text, fontWeight: "700" },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { color: colors.text, fontWeight: "700" },
  cardMeta: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
});
