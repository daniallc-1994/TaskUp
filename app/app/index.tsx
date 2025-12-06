import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/onboarding" />;
}
