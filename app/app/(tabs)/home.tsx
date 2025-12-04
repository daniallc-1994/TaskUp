import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeTab() {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 24, gap: 12, justifyContent: "center" },
  overline: { color: "#24c0f7", letterSpacing: 2, textTransform: "uppercase" },
  title: { color: "white", fontSize: 28, fontWeight: "700" },
  body: { color: "#cbd5e1", fontSize: 16, lineHeight: 22 },
  button: { backgroundColor: "#8B5CFF", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "600" },
});
