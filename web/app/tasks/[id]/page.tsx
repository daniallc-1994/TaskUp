'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Task, Offer } from "../../../lib/types";

type Params = { params: { id: string } };

export default function TaskDetail({ params }: Params) {
  const { id } = params;
  const { token } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get(`/api/tasks/${id}`, token).then(setTask).catch(console.error);
    api.get(`/api/offers?task_id=${id}`, token).then(setOffers).catch(console.error);
  }, [token, id]);

  return (
    <Protected>
      <DashboardShell
        title={task?.title || `Task ${id}`}
        subtitle="View task details, offers, chat, and escrow status."
        actions={[<Link key="order" href={`/orders/${id}`} className="text-purple-300 font-semibold">Open order room</Link>]}
      >
        <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm space-y-2">
          <p>Budget: {task?.budget_cents ? `${(task.budget_cents / 100).toFixed(0)} kr` : "—"}</p>
          <p>Status: {task?.status ?? "loading"}</p>
          <p>Location: {task?.address ?? "—"}</p>
        </Card>
        <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm">
          <div className="font-semibold text-white mb-2">Offers</div>
          <div className="space-y-2">
            {offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <div>{(o.amount_cents / 100).toFixed(0)} kr</div>
                <div className="text-xs text-gray-400">{o.status}</div>
              </div>
            ))}
            {offers.length === 0 ? <div className="text-gray-400 text-sm">No offers yet.</div> : null}
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
