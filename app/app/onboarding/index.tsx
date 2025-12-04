import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.overline}>Welcome</Text>
      <Text style={styles.title}>TaskUp on mobile</Text>
      <Text style={styles.body}>Post tasks, get offers, chat, and release escrow from your phone.</Text>
      <Link href="/auth" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 24, justifyContent: "center", gap: 12 },
  overline: { color: "#24c0f7", letterSpacing: 2, textTransform: "uppercase" },
  title: { color: "white", fontSize: 28, fontWeight: "700" },
  body: { color: "#cbd5e1", fontSize: 16, lineHeight: 22 },
  button: { backgroundColor: "#8B5CFF", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "600" },
});
