import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { colors } from "../../theme";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";
import { useAuth } from "../../contexts/AuthContext";

type Task = { id: string; title: string; status: string; budget_cents?: number };

export default function HomeTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get("/api/tasks")
      .then((res) => setTasks(res || []))
      .catch((err) => setError(getUserFriendlyMessage(parseApiError(err), t)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.overline}>{user?.role === "tasker" ? t("tasker.title") : t("tasks_title")}</Text>
      <Text style={styles.title}>{t("tasks_title")}</Text>
      <Text style={styles.body}>Post any job, set budget, get live offers, and chat in the order room.</Text>
      <Link href="/(tabs)/tasks" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{t("tasks_title")}</Text>
        </Pressable>
      </Link>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.status}</Text>
            <Text style={styles.cardMeta}>
              {item.budget_cents ? `${(item.budget_cents / 100).toFixed(0)} kr` : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("tasks_empty")}</Text> : null}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, gap: 12 },
  overline: { color: colors.cyan, letterSpacing: 2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  button: { backgroundColor: colors.purple, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 4 },
  buttonText: { color: colors.text, fontWeight: "700" },
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
