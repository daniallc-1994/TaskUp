import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.overline}>TaskUp mobile</Text>
      <Text style={styles.title}>Scaffold ready</Text>
      <Text style={styles.body}>
        Build onboarding, auth, tasks, live offers, chat, wallet, profile, and admin tooling per the master spec.
      </Text>
      <Link href="/auth" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Auth (coming soon)</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C15",
    padding: 24,
    justifyContent: "center",
  },
  overline: {
    color: "#24c0f7",
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#8B5CFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
