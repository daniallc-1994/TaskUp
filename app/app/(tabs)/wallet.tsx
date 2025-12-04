import { View, Text, StyleSheet } from "react-native";

export default function WalletTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.card}>
        <Text style={styles.balanceLabel}>Escrow balance</Text>
        <Text style={styles.balanceValue}>3,200 NOK</Text>
        <Text style={styles.hint}>Payouts via Stripe Connect when orders are confirmed.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  card: { backgroundColor: "#111827", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1f2937", gap: 6 },
  balanceLabel: { color: "#cbd5e1" },
  balanceValue: { color: "white", fontSize: 28, fontWeight: "700" },
  hint: { color: "#94a3b8", fontSize: 12 },
});
