import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { colors } from "../../theme";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.overline}>TaskUp</Text>
      <Text style={styles.title}>Get any task done fast</Text>
      <Text style={styles.body}>Dark neon, secure escrow, live offers, realtime chat. Start as client or tasker.</Text>
      <View style={styles.buttons}>
        <Link href="/auth/signup" asChild>
          <Pressable style={[styles.button, styles.primary]}>
            <Text style={styles.buttonText}>Get started</Text>
          </Pressable>
        </Link>
        <Link href="/auth" asChild>
          <Pressable style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center", gap: 12 },
  overline: { color: colors.cyan, letterSpacing: 2, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 16, lineHeight: 22 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 16 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  primary: { backgroundColor: colors.purple },
  secondary: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.text, fontWeight: "700" },
});
