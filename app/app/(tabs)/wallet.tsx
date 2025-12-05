import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { api } from "../../lib/api";
import { colors } from "../../theme";

type Payment = { id: string; amount_cents: number; status: string };

export default function WalletTab() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    api.get("/api/payments").then((res) => setPayments(res || [])).catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const escrowed = payments.filter((p) => p.status === "escrowed").reduce((s, p) => s + (p.amount_cents || 0), 0);
    const released = payments.filter((p) => p.status === "payment_released").reduce((s, p) => s + (p.amount_cents || 0), 0);
    const refunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + (p.amount_cents || 0), 0);
    return { escrowed, released, refunded };
  }, [payments]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Escrow</Text>
          <Text style={styles.cardValue}>{(summary.escrowed / 100).toFixed(2)} kr</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Released</Text>
          <Text style={styles.cardValue}>{(summary.released / 100).toFixed(2)} kr</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Refunded</Text>
          <Text style={styles.cardValue}>{(summary.refunded / 100).toFixed(2)} kr</Text>
        </View>
      </View>
      {payments.map((p) => (
        <View key={p.id} style={styles.listItem}>
          <Text style={styles.cardLabel}>{p.id}</Text>
          <Text style={styles.cardValueSmall}>{(p.amount_cents / 100).toFixed(0)} kr</Text>
          <Text style={styles.status}>{p.status}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  cardLabel: { color: colors.muted, fontSize: 12 },
  cardValue: { color: colors.text, fontWeight: "700", fontSize: 18 },
  cardValueSmall: { color: colors.text, fontWeight: "600", fontSize: 14 },
  listItem: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  status: { color: colors.purple, fontWeight: "600" },
});
