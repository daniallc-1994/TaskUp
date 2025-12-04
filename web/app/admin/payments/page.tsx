'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Payment } from "../../../lib/types";

export default function AdminPayments() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/admin/payments", token)
      .then((res) => setPayments(res || []))
      .catch((err) => console.error("admin payments", err));
  }, [token]);

  return (
    <Protected role="admin">
      <DashboardShell title="Payments" subtitle="View escrow, released, and refunded payments." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {payments.map((p) => (
            <Card key={p.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{(p.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{p.id}</div>
              </div>
              <span className="text-cyan-300">{p.status}</span>
            </Card>
          ))}
          {payments.length === 0 ? <div className="text-gray-400 text-sm">No payments loaded.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
