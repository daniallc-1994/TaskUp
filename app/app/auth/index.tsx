import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { api } from "../../lib/api";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/api/auth/login", { email, password });
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
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={login} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "..." : "Sign in"}</Text>
      </Pressable>
      {message ? <Text style={{ color: "#a5f3fc", marginTop: 8 }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C15",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  button: {
    backgroundColor: "#8B5CFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
