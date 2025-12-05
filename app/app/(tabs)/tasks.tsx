'use client';

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, TextInput } from "react-native";
import { api } from "../../lib/api";
import { colors } from "../../theme";

type Task = { id: string; title: string; status: string; budget_cents?: number };

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [desc, setDesc] = useState("");

  const load = () => {
    api.get("/api/tasks").then((res) => setTasks(res || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async () => {
    await api.post("/api/tasks", {
      title,
      description: desc,
      budget_cents: budget ? parseInt(budget, 10) * 100 : undefined,
      currency: "NOK",
    });
    setTitle("");
    setBudget("");
    setDesc("");
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.status}</Text>
            <Text style={styles.cardMeta}>{item.budget_cents ? `${(item.budget_cents / 100).toFixed(0)} kr` : ""}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No tasks yet</Text>}
        style={{ marginTop: 12 }}
      />
      <View style={styles.form}>
        <TextInput placeholder="Title" placeholderTextColor={colors.muted} style={styles.input} value={title} onChangeText={setTitle} />
        <TextInput placeholder="Budget NOK" placeholderTextColor={colors.muted} style={styles.input} value={budget} onChangeText={setBudget} />
        <TextInput
          placeholder="Description"
          placeholderTextColor={colors.muted}
          style={[styles.input, { height: 80 }]}
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <Pressable style={styles.button} onPress={createTask}>
          <Text style={styles.buttonText}>Create task</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
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
