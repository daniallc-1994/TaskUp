import { View, Text, StyleSheet, Pressable } from "react-native";

export default function ProfileTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>John Doe</Text>
        <Text style={styles.cardBody}>tasker@example.com</Text>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Edit profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  card: { backgroundColor: "#111827", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1f2937", gap: 6 },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  cardBody: { color: "#cbd5e1" },
  button: { backgroundColor: "#8B5CFF", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "600" },
});
