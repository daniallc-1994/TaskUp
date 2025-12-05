import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { colors } from "../../theme";

type Task = { id: string; title: string; status: string; budget_cents?: number };

export default function HomeTab() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.get("/api/tasks").then((res) => setTasks(res || [])).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.overline}>Client</Text>
      <Text style={styles.title}>Create a task</Text>
      <Text style={styles.body}>Post any job, set budget, get live offers, and chat in the order room.</Text>
      <Link href="/(tabs)/tasks" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>View tasks</Text>
        </Pressable>
      </Link>
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
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No tasks yet</Text>}
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
