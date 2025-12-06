import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { colors } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { registerPushToken } from "../../lib/notifications";
import { t } from "../../lib/i18n";
import { useRouter } from "expo-router";
import { trackEvent, trackError } from "../../lib/telemetry";

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.full_name || "");
  const [language, setLanguage] = useState("en");
  const [radius, setRadius] = useState("100");
  const [message, setMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setName(user?.full_name || "");
  }, [user]);

  const save = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.patch("/api/auth/profile", { full_name: name, language, radius_preference_km: parseInt(radius, 10) || 100 });
      setMessage(t("toasts_saved"));
    } catch (err) {
      setMessage(getUserFriendlyMessage(parseApiError(err), t));
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api.get("/api/auth/account/export");
      Alert.alert(t("gdpr_export"), t("toasts_export_ready"));
      console.log("Export", JSON.stringify(data).slice(0, 500));
      trackEvent("gdpr.export_success", { source: "mobile" });
    } catch (err) {
      Alert.alert("Error", getUserFriendlyMessage(parseApiError(err), t));
      trackError(err, { source: "mobile", endpoint: "/api/auth/account/export" });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      Alert.alert(t("gdpr_delete"), t("gdpr_delete_confirm"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/account/delete");
      await logout();
      router.replace("/onboarding");
      Alert.alert(t("gdpr_delete"), t("toasts_account_deleted"));
      trackEvent("gdpr.delete_success", { source: "mobile" });
    } catch (err) {
      Alert.alert("Error", getUserFriendlyMessage(parseApiError(err), t));
      trackError(err, { source: "mobile", endpoint: "/api/auth/account/delete" });
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t("settings_title")}</Text>
      <Text style={styles.muted}>{user?.email}</Text>
      <Text style={styles.muted}>{user?.role}</Text>
      <TextInput placeholder={t("auth_fullname")} placeholderTextColor={colors.muted} style={styles.input} value={name} onChangeText={setName} />
      <TextInput
        placeholder={t("settings_language")}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={language}
        onChangeText={setLanguage}
      />
      <TextInput placeholder={t("settings_radius")} placeholderTextColor={colors.muted} style={styles.input} value={radius} onChangeText={setRadius} />
      {message ? <Text style={{ color: colors.cyan, marginTop: 8 }}>{message}</Text> : null}
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      <Pressable style={styles.button} onPress={save} disabled={loading}>
        <Text style={styles.buttonText}>{t("settings_save")}</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => registerPushToken()}>
        <Text style={styles.buttonText}>Enable push</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.title}>{t("gdpr_export")}</Text>
        <Text style={styles.muted}>{t("gdpr_export_desc")}</Text>
        <Pressable style={styles.button} onPress={exportData} disabled={exporting}>
          <Text style={styles.buttonText}>{t("gdpr_export")}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: "tomato" }]}>{t("gdpr_delete")}</Text>
        <Text style={styles.muted}>{t("gdpr_delete_desc")}</Text>
        <TextInput
          placeholder={t("gdpr_delete_confirm")}
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={deleteConfirm}
          onChangeText={setDeleteConfirm}
        />
        <Pressable
          style={[styles.button, { backgroundColor: "tomato" }]}
          onPress={deleteAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{t("gdpr_delete")}</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.button, { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }]} onPress={doLogout}>
        <Text style={styles.buttonText}>{t("settings_logout")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 12 },
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
  section: { marginTop: 18, gap: 6 },
});
