'use client';

import { useEffect, useMemo, useState } from "react";
import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { Task, Payment } from "../../lib/types";

export default function DashboardPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/tasks", token)
      .then((res) => setTasks(res || []))
      .catch((err) => console.error("tasks load", err));
    api
      .get("/api/payments", token)
      .then((res) => setPayments(res || []))
      .catch((err) => console.error("payments load", err));
  }, [token]);

  const stats = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "payment_released").length;
    const escrowed = payments.filter((p) => p.status === "escrowed").reduce((sum, p) => sum + (p.amount_cents || 0), 0);
    return [
      { label: "Open tasks", value: openTasks.toString(), hint: "Awaiting offers or in progress" },
      { label: "Escrow balance", value: `${(escrowed / 100).toFixed(2)} kr`, hint: "Held in Stripe" },
      { label: "Payments", value: payments.length.toString(), hint: "Total rows" },
    ];
  }, [tasks, payments]);

  return (
    <Protected>
      <DashboardShell
        title="Client dashboard"
        subtitle="Track your tasks, offers, and escrow in one place."
        actions={
          <Button asChild>
            <Link href="/tasks/new">Post a task</Link>
          </Button>
        }
      >
        <div className="grid md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4 bg-white/5 border-white/10">
              <div className="text-sm text-gray-400 font-semibold">{s.label}</div>
              <div className="text-2xl font-black text-white mt-2">{s.value}</div>
              <div className="text-xs text-gray-400">{s.hint}</div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-bold">Your tasks</div>
              <p className="text-sm text-gray-400">Tap to open the order room and chat with taskers.</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks">View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((t) => (
              <Link
                key={t.id}
                href={`/orders/${t.id}`}
                className="flex items-center justify-between px-3 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
              >
                <div>
                  <div className="font-semibold text-white">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.status}</div>
                </div>
                <div className="text-sm font-bold text-purple-200">
                  {t.budget_cents ? `${(t.budget_cents / 100).toFixed(0)} kr` : "-"}
                </div>
              </Link>
            ))}
            {tasks.length === 0 ? <div className="text-gray-400 text-sm">No tasks yet.</div> : null}
          </div>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
