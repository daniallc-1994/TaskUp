'use client';

import { useEffect, useMemo, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { Payment } from "../../lib/types";

export default function WalletPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/payments", token)
      .then((res) => setPayments(res || []))
      .catch((err) => console.error("payments", err));
  }, [token]);

  const summary = useMemo(() => {
    const escrowed = payments.filter((p) => p.status === "escrowed").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const released = payments.filter((p) => p.status === "payment_released").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    const refunded = payments.filter((p) => p.status === "refunded").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    return { escrowed, released, refunded };
  }, [payments]);

  return (
    <Protected>
      <DashboardShell title="Wallet" subtitle="Escrow, released payments, and refunds.">
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">Escrow balance</div>
            <div className="text-2xl font-black text-white">{(summary.escrowed / 100).toFixed(2)} kr</div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">Released</div>
            <div className="text-2xl font-black text-white">{(summary.released / 100).toFixed(2)} kr</div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-sm text-gray-300">Refunded</div>
            <div className="text-2xl font-black text-white">{(summary.refunded / 100).toFixed(2)} kr</div>
          </Card>
        </div>
        <Card className="p-4 bg-white/5 border-white/10 text-sm text-gray-200">
          <div className="font-semibold text-white mb-2">Payments</div>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>{(p.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{p.status}</div>
              </div>
            ))}
            {payments.length === 0 ? <div className="text-gray-400 text-sm">No payments yet.</div> : null}
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
