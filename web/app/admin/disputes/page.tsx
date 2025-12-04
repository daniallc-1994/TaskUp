'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { Dispute } from "../../../lib/types";

export default function AdminDisputes() {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const load = () => {
    if (!token) return;
    api
      .get("/api/admin/disputes", token)
      .then((res) => setDisputes(res || []))
      .catch((err) => console.error("admin disputes", err));
  };

  useEffect(() => {
    load();
  }, [token]);

  const resolve = async (id: string, resolution: "release" | "refund") => {
    await api.post(`/api/disputes/${id}/resolve`, { resolution }, token!).catch(console.error);
    load();
  };

  return (
    <Protected role="admin">
      <DashboardShell title="Disputes" subtitle="Resolve by releasing or refunding escrow." variant="admin">
        <div className="space-y-3 text-sm text-gray-200">
          {disputes.map((d) => (
            <Card key={d.id} className="p-3 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{d.reason}</div>
                  <div className="text-xs text-gray-400">{d.id}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "release")}>
                    Release
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(d.id, "refund")}>
                    Refund
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{d.status}</div>
            </Card>
          ))}
          {disputes.length === 0 ? <div className="text-gray-400 text-sm">No disputes loaded.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
