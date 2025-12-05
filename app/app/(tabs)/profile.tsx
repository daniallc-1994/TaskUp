import { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { colors } from "../../theme";
import { clearToken, saveToken } from "../../lib/storage";
import { setAuthToken } from "../../lib/api";

export default function ProfileTab() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [radius, setRadius] = useState("100");
  const [message, setMessage] = useState<string | null>(null);

  const save = () => {
    setMessage("Saved locally (connect to backend profile endpoint).");
  };

  const logout = async () => {
    setAuthToken(undefined);
    await clearToken();
    setMessage("Logged out");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile & Settings</Text>
      <TextInput placeholder="Full name" placeholderTextColor={colors.muted} style={styles.input} value={name} onChangeText={setName} />
      <TextInput
        placeholder="Language (en/nb/...)"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={language}
        onChangeText={setLanguage}
      />
      <TextInput placeholder="Radius km" placeholderTextColor={colors.muted} style={styles.input} value={radius} onChangeText={setRadius} />
      <Pressable style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
      <Pressable style={[styles.button, { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }]} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
      {message ? <Text style={{ color: colors.cyan, marginTop: 8 }}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  button: { backgroundColor: colors.purple, padding: 12, borderRadius: 12, alignItems: "center", marginTop: 4 },
  buttonText: { color: colors.text, fontWeight: "700" },
});
