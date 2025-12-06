import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "tasker">("client");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await signup({ full_name: name, email, password, role });
      if (res.ok) router.replace("/(tabs)/home");
      else setMessage(res.error || t("errors_unknown"));
    } catch (e: any) {
      const parsed = parseApiError(e);
      setMessage(getUserFriendlyMessage(parsed, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth_signup")}</Text>
      <TextInput style={styles.input} placeholder={t("auth_fullname")} placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder={t("auth_email")}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t("auth_password")}
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.roleRow}>
        <Pressable style={[styles.pill, role === "client" && styles.pillActive]} onPress={() => setRole("client")}>
          <Text style={styles.pillText}>{t("auth_role_client")}</Text>
        </Pressable>
        <Pressable style={[styles.pill, role === "tasker" && styles.pillActive]} onPress={() => setRole("tasker")}>
          <Text style={styles.pillText}>{t("auth_role_tasker")}</Text>
        </Pressable>
      </View>
      <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "..." : t("auth_signup")}</Text>
      </Pressable>
      {message ? <Text style={{ color: colors.cyan, marginTop: 8 }}>{message}</Text> : null}
      <Link href="/auth" asChild>
        <Pressable style={{ marginTop: 16 }}>
          <Text style={{ color: colors.muted }}>{t("auth_login")}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, gap: 12, justifyContent: "center" },
  title: { color: colors.text, fontSize: 26, fontWeight: "700" },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: { backgroundColor: colors.purple, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "700" },
  roleRow: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.glass,
  },
  pillActive: { borderColor: colors.purple, backgroundColor: "#8B5CFF33" },
  pillText: { color: colors.text, fontWeight: "600" },
});
