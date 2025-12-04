import { View, Text, StyleSheet } from "react-native";

export default function OffersTab() {
  const offers = [
    { task: "Assemble furniture", status: "pending", amount: "1200 NOK" },
    { task: "Move boxes", status: "accepted", amount: "900 NOK" },
  ];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Offers</Text>
      {offers.map((o) => (
        <View key={o.task} style={styles.card}>
          <Text style={styles.cardTitle}>{o.task}</Text>
          <Text style={styles.cardBody}>{o.amount}</Text>
          <Text style={styles.status}>{o.status}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C15", padding: 16, gap: 12 },
  title: { color: "white", fontSize: 24, fontWeight: "700", marginBottom: 4 },
  card: { backgroundColor: "#111827", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#1f2937", gap: 4 },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  cardBody: { color: "#cbd5e1" },
  status: { color: "#24c0f7", fontWeight: "600" },
});
