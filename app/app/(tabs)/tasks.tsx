import { View, Text, StyleSheet, Pressable } from "react-native";

export default function TasksTab() {
  const mockTasks = [
    { title: "Assemble furniture", budget: "1200 NOK" },
    { title: "Move boxes", budget: "900 NOK" },
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      {mockTasks.map((t) => (
        <View key={t.title} style={styles.card}>
          <Text style={styles.cardTitle}>{t.title}</Text>
          <Text style={styles.cardBody}>{t.budget}</Text>
          <Pressable style={styles.action}>
            <Text style={styles.actionText}>Send offer</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  card: { backgroundColor: "#111827", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1f2937", gap: 6 },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  cardBody: { color: "#cbd5e1" },
  action: { backgroundColor: "#8B5CFF", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  actionText: { color: "white", fontWeight: "600" },
});
