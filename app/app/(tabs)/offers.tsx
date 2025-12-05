import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { api } from "../../lib/api";
import { colors } from "../../theme";

type Offer = { id: string; task_id: string; amount_cents: number; status: string };

export default function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [taskId, setTaskId] = useState("");
  const [amount, setAmount] = useState("");

  const load = () => {
    api.get("/api/offers").then((res) => setOffers(res || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const createOffer = async () => {
    await api.post("/api/offers", { task_id: taskId, amount_cents: parseInt(amount, 10) * 100, message: "Mobile offer" });
    setTaskId("");
    setAmount("");
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offers</Text>
      {offers.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.cardTitle}>{(o.amount_cents / 100).toFixed(0)} kr</Text>
          <Text style={styles.cardMeta}>{o.task_id}</Text>
          <Text style={styles.cardMeta}>{o.status}</Text>
        </View>
      ))}
      <View style={styles.form}>
        <TextInput
          placeholder="Task ID"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={taskId}
          onChangeText={setTaskId}
        />
        <TextInput placeholder="Amount NOK" placeholderTextColor={colors.muted} style={styles.input} value={amount} onChangeText={setAmount} />
        <Pressable style={styles.button} onPress={createOffer}>
          <Text style={styles.buttonText}>Send offer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { color: colors.text, fontWeight: "700" },
  cardMeta: { color: colors.muted, fontSize: 12 },
  form: { marginTop: 12, gap: 8 },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  button: { backgroundColor: colors.purple, padding: 12, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.text, fontWeight: "700" },
});
