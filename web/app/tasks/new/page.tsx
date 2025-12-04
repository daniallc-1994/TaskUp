'use client';

import { useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";

export default function NewTaskPage() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        title,
        description: desc,
        budget_cents: budget ? parseInt(budget, 10) * 100 : undefined,
        currency: "NOK",
      };
      await api.post("/api/tasks", payload, token);
      setMessage("Task created!");
      setTitle("");
      setBudget("");
      setDesc("");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message || "Could not create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
      <DashboardShell title="Post a new task" subtitle="Describe what you need and get live offers.">
        <Card className="p-6 bg-white/5 border-white/10 space-y-4">
          <div>
            <label className="text-sm text-gray-300">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Assemble IKEA wardrobe" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Budget (NOK)</label>
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="2500" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Description</label>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Add details, location, timing..."
            />
          </div>
          <Button onClick={submit} disabled={loading || !token}>
            {loading ? "Saving..." : "Save task"}
          </Button>
          {message ? <div className="text-green-300 text-sm">{message}</div> : null}
        </Card>
      </DashboardShell>
    </Protected>
  );
}
