'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Offer } from "../../../lib/types";

export default function TaskerOffers() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/offers", token)
      .then((res) => setOffers(res || []))
      .catch((err) => console.error("tasker offers", err));
  }, [token]);

  return (
    <Protected>
      <DashboardShell title="My offers" subtitle="Track sent offers and their statuses." variant="tasker">
        <div className="space-y-3">
          {offers.map((o) => (
            <Card key={o.id} className="p-4 bg-white/5 border-white/10 text-sm text-gray-200 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{(o.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{o.task_id}</div>
              </div>
              <span className="text-cyan-300">{o.status}</span>
            </Card>
          ))}
          {offers.length === 0 ? <div className="text-gray-400 text-sm">No offers yet.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
