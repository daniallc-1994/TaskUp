'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Task, Offer, Message, Payment, Dispute } from "../../../lib/types";
import { supabase } from "../../../lib/supabase";

type Params = { params: { id: string } };

export default function OrderRoom({ params }: Params) {
  const { token, user } = useAuth();
  const { id } = params;
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");

  const load = () => {
    if (!token) return;
    api.get(`/api/tasks/${id}`, token).then(setTask).catch(console.error);
    api.get(`/api/offers?task_id=${id}`, token).then(setOffers).catch(console.error);
    api.get(`/api/messages?task_id=${id}`, token).then(setMessages).catch(console.error);
    api.get(`/api/payments`, token).then((rows) => setPayments((rows || []).filter((p: Payment) => p.task_id === id))).catch(console.error);
    api.get(`/api/disputes`, token).then((rows) => setDisputes((rows || []).filter((d: Dispute) => d.task_id === id))).catch(console.error);
  };

  useEffect(() => {
    load();
  }, [token, id]);

  useEffect(() => {
    if (!supabase) return;
    const msgSub = supabase
      .channel(`messages-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `task_id=eq.${id}` }, () => load())
      .subscribe();
    const offerSub = supabase
      .channel(`offers-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `task_id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      if (supabase) {
        supabase.removeChannel(msgSub);
        supabase.removeChannel(offerSub);
      }
    };
  }, [id, supabase]);

  const sendMessage = async () => {
    if (!token || !user || !body) return;
    await api.post(
      "/api/messages",
      {
        task_id: id,
        sender_id: (user as any).id,
        recipient_id: offers[0]?.tasker_id || "unknown",
        body,
      },
      token
    );
    setBody("");
    load();
  };

  const markDone = async () => {
    if (!token) return;
    await api.post(`/api/tasks/${id}/mark-done`, {}, token).catch(console.error);
    load();
  };

  const markReceived = async () => {
    if (!token) return;
    await api.post(`/api/tasks/${id}/confirm-received`, {}, token).catch(console.error);
    load();
  };

  const openDispute = async () => {
    if (!token || !reason) return;
    const paymentId = payments[0]?.id;
    await api.post(
      "/api/disputes",
      {
        task_id: id,
        payment_id: paymentId,
        opened_by: (user as any)?.id,
        reason,
      },
      token
    );
    setReason("");
    load();
  };

  return (
    <Protected>
      <DashboardShell
        title={`Order #${id}`}
        subtitle="Chat with the tasker, follow the status, confirm or dispute."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={markDone}>
              Mark as done (tasker)
            </Button>
            <Button onClick={markReceived}>Mark as received</Button>
            <Button variant="outline" onClick={openDispute}>
              Open dispute
            </Button>
          </div>
        }
      >
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm h-72">
              <div className="font-semibold text-white mb-2">Chat</div>
              <div className="space-y-2 overflow-y-auto h-56 pr-2">
                {messages.map((m) => (
                  <div key={m.id} className={`p-3 rounded-lg ${m.sender_id === (user as any)?.id ? "bg-purple-600/30 ml-6" : "bg-white/5"}`}>
                    {m.body}
                  </div>
                ))}
                {messages.length === 0 ? <div className="text-gray-400">No messages yet.</div> : null}
              </div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10 text-sm text-gray-200 space-y-3">
              <p className="font-semibold text-white">Compose</p>
              <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Send a message" />
              <Button onClick={sendMessage} disabled={!body}>
                Send
              </Button>
            </Card>
          </div>
          <div className="space-y-3">
            <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm">
              <h3 className="text-white font-semibold mb-2">Order details</h3>
              <p>Task: {task?.title ?? "Loading..."}</p>
              <p>Total: {offers[0]?.amount_cents ? `${(offers[0].amount_cents / 100).toFixed(0)} kr` : "-"}</p>
              <p>Status: {task?.status ?? "-"}</p>
              <p className="text-xs text-gray-400 mt-2">Escrowed via Stripe Connect</p>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm">
              <h3 className="text-white font-semibold mb-2">Offers</h3>
              <ul className="space-y-2">
                {offers.map((o) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <span>{(o.amount_cents / 100).toFixed(0)} kr</span>
                    <span className="text-gray-400 text-xs">{o.status}</span>
                  </li>
                ))}
                {offers.length === 0 ? <div className="text-gray-400 text-sm">No offers yet.</div> : null}
              </ul>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10 text-gray-200 text-sm space-y-2">
              <h3 className="text-white font-semibold">Dispute</h3>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
              <Button variant="outline" onClick={openDispute} disabled={!reason}>
                Submit dispute
              </Button>
              <div className="text-xs text-gray-400">
                {disputes.map((d) => (
                  <div key={d.id}>
                    {d.reason} – {d.status}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </Protected>
  );
}
