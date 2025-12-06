import * as Notifications from "expo-notifications";
import { api } from "./api";
import { getItemAsync, setItemAsync } from "expo-secure-store";

const LAST_REGISTERED = "taskup_last_push";

export async function registerPushToken(token?: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const stored = await getItemAsync(LAST_REGISTERED);
    const now = Date.now();
    if (stored && now - parseInt(stored, 10) < 1000 * 60 * 60) return;
    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    await setItemAsync(LAST_REGISTERED, `${now}`);
    // Best-effort register token with backend
    await api.post("/api/notifications/register-device", { token: pushToken }, token);
  } catch (err) {
    console.log("[notifications] register push failed", err);
  }
}
