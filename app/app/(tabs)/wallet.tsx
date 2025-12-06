import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from "react-native";
import { api } from "../../lib/api";
import { colors } from "../../theme";
import { parseApiError, getUserFriendlyMessage } from "../../lib/apiErrors";
import { t } from "../../lib/i18n";
import { trackEvent, trackError } from "../../lib/telemetry";

type Transaction = { id: string; amount_cents: number; status: string; type?: string; created_at?: string; currency?: string };
type Wallet = { available_balance?: number; escrow_balance?: number; currency?: string };

export default function WalletTab() {
  const [wallet, setWallet] = useState<Wallet>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const load = (nextPage = 1, append = false) => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/api/payments/wallet"), api.get(`/api/payments/transactions?page=${nextPage}&limit=${limit}`)])
      .then(([w, tx]) => {
        setWallet(w || {});
        const list = tx || [];
        setTransactions((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= limit);
        setPage(nextPage);
        trackEvent("wallet.viewed", { source: "mobile", page: nextPage });
        trackEvent("wallet.transactions_viewed", { source: "mobile", page: nextPage, count: list.length });
      })
      .catch((err) => {
        setError(getUserFriendlyMessage(parseApiError(err), t));
        trackError(err, { source: "mobile", endpoint: "/api/payments/transactions", page: nextPage });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      available: wallet.available_balance || 0,
      escrow: wallet.escrow_balance || 0,
    };
  }, [wallet]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("wallet_title")}</Text>
      {loading ? <ActivityIndicator color={colors.purple} /> : null}
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t("wallet_title")}</Text>
          <Text style={styles.cardValue}>
            {(summary.available / 100).toFixed(2)} {wallet.currency || "NOK"}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Escrow</Text>
          <Text style={styles.cardValue}>
            {(summary.escrow / 100).toFixed(2)} {wallet.currency || "NOK"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable style={styles.buttonGhost} onPress={() => {}}>
          <Text style={styles.buttonText}>{t("wallet_topup")}</Text>
        </Pressable>
        <Pressable style={styles.buttonGhost} onPress={() => {}}>
          <Text style={styles.buttonText}>{t("wallet_payout")}</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>{t("wallet_transactions")}</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.cardLabel}>{item.type || "-"}</Text>
            <Text style={styles.cardValueSmall}>
              {(item.amount_cents / 100).toFixed(0)} {item.currency || wallet.currency || "NOK"}
            </Text>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.cardMeta}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: colors.muted }}>{t("wallet_empty")}</Text> : null}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.buttonGhost} onPress={() => load(page + 1, true)} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "..." : "Load more"}</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, marginTop: 8 },
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
  cardMeta: { color: colors.muted, fontSize: 11 },
  listItem: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  status: { color: colors.purple, fontWeight: "600" },
  buttonGhost: {
    flex: 1,
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: colors.text, fontWeight: "700" },
});
