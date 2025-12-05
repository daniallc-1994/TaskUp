import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { api, setAuthToken } from "../../lib/api";
import { colors } from "../../theme";
import { Link } from "expo-router";
import { saveToken } from "../../lib/storage";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const token = res?.access_token || res?.token;
      if (token) {
        setAuthToken(token);
        await saveToken(token);
      }
      setMessage("Logged in");
    } catch (e: any) {
        setMessage(e?.message || "Login failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={login} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "..." : "Sign in"}</Text>
      </Pressable>
      {message ? <Text style={{ color: colors.cyan, marginTop: 8 }}>{message}</Text> : null}
      <Link href="/auth/signup" asChild>
        <Pressable style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted }}>Need an account? Sign up</Text>
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
