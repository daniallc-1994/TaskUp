import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { colors } from "../../theme";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await login(email, password);
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
      <Text style={styles.title}>{t("auth_login")}</Text>
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
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "..." : t("auth_login")}</Text>
      </Pressable>
      {message ? <Text style={{ color: colors.cyan, marginTop: 8 }}>{message}</Text> : null}
      <Link href="/auth/signup" asChild>
        <Pressable style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted }}>{t("auth_signup")}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.purple,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "600",
  },
});
