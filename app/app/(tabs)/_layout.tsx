import { Tabs } from "expo-router";
import { colors } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import { t } from "../../lib/i18n";

export default function TabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("nav_home"), href: user ? undefined : null }} />
      <Tabs.Screen name="tasks" options={{ title: t("nav_tasks"), href: user ? undefined : null }} />
      <Tabs.Screen name="offers" options={{ title: t("nav_offers"), href: user ? undefined : null }} />
      <Tabs.Screen name="messages" options={{ title: t("nav_messages"), href: user ? undefined : null }} />
      <Tabs.Screen name="wallet" options={{ title: t("nav_wallet"), href: user ? undefined : null }} />
      <Tabs.Screen name="profile" options={{ title: t("nav_profile"), href: user ? undefined : null }} />
    </Tabs>
  );
}
