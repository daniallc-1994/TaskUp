'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";

type AdminUser = { email: string; role: string; status?: string; id: string; kyc_status?: string; risk_score?: number; flags?: any };

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [note, setNote] = useState("");
  const [risk, setRisk] = useState("");
  const [kyc, setKyc] = useState("not_started");
  const [selected, setSelected] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    api
      .get("/api/admin/users", token)
      .then((res) => setUsers(res || []))
      .catch((err) => console.error("admin users", err));
  };

  useEffect(() => {
    load();
  }, [token]);

  const saveKyc = async () => {
    if (!token || !selected) return;
    await api.post(`/api/admin/users/${selected}/kyc?kyc_status=${kyc}`, {}, token);
    load();
  };

  const saveRisk = async () => {
    if (!token || !selected) return;
    await api.post(`/api/admin/users/${selected}/risk?risk_score=${risk}&note=${encodeURIComponent(note)}`, {}, token);
    load();
  };

  const addFlag = async () => {
    if (!token || !selected) return;
    await api.post(`/api/admin/users/${selected}/flags?note=${encodeURIComponent(note)}`, {}, token);
    load();
  };

  return (
    <Protected role="admin">
      <DashboardShell title="Users" subtitle="Manage roles, KYC, risk, bans, and audits." variant="admin">
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-200">
          {users.map((u) => (
            <Card
              key={u.id}
              className={`p-3 bg-white/5 border-white/10 ${selected === u.id ? "border-[#8B5CFF]" : ""}`}
              onClick={() => setSelected(u.id)}
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-white font-semibold">{u.email}</div>
                  <div>{u.role}</div>
                  <div className="text-xs text-gray-400">KYC: {u.kyc_status || "not_started"}</div>
                  <div className="text-xs text-gray-400">Risk: {u.risk_score ?? 0}</div>
                </div>
                <span className="text-cyan-300">{u.status || "active"}</span>
              </div>
            </Card>
          ))}
        </div>
        {users.length === 0 ? <div className="text-gray-400 text-sm">No users loaded.</div> : null}
        {selected ? (
          <Card className="p-4 bg-white/5 border-white/10 space-y-3">
            <div className="text-white font-semibold">Moderate user</div>
            <div className="flex gap-2">
              <Input value={kyc} onChange={(e) => setKyc(e.target.value)} placeholder="kyc_status" />
              <Button onClick={saveKyc}>Save KYC</Button>
            </div>
            <div className="flex gap-2">
              <Input value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="risk score" />
              <Button onClick={saveRisk}>Save risk</Button>
            </div>
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="flag note" />
              <Button variant="outline" onClick={addFlag}>
                Add flag
              </Button>
            </div>
          </Card>
        ) : null}
      </DashboardShell>
    </Protected>
  );
}
