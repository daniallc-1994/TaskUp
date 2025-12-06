'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import { adminPaginated } from "../../../lib/adminApi";
import { parseApiError, getUserFriendlyMessage } from "../../../lib/apiErrors";
import { trackEvent, trackError } from "../../../lib/telemetry";

type AdminUser = { email: string; role: string; status?: string; id: string; kyc_status?: string; risk_score?: number; flags?: any };

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [note, setNote] = useState("");
  const [risk, setRisk] = useState("");
  const [kyc, setKyc] = useState("not_started");
  const [selected, setSelected] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setError(null);
    adminPaginated<AdminUser[]>("/api/admin/users", token, page, limit)
      .then((res) => {
        setUsers(res || []);
        trackEvent("admin.users.viewed", { source: "web", page });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        setError(getUserFriendlyMessage(parsed));
        trackError(parsed, { source: "web", endpoint: "/api/admin/users", page });
      });
  };

  useEffect(() => {
    load();
  }, [token, page]);

  const saveKyc = async () => {
    if (!token || !selected) return;
    try {
      await api.post(`/api/admin/users/${selected}/kyc?kyc_status=${kyc}`, {}, token);
      trackEvent("admin.users.kyc_updated", { source: "web", userId: selected, kyc });
      load();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserFriendlyMessage(parsed));
      trackError(parsed, { source: "web", endpoint: "/api/admin/users/kyc", userId: selected });
    }
  };

  const saveRisk = async () => {
    if (!token || !selected) return;
    try {
      await api.post(`/api/admin/users/${selected}/risk?risk_score=${risk}&note=${encodeURIComponent(note)}`, {}, token);
      trackEvent("admin.users.risk_updated", { source: "web", userId: selected, risk });
      load();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserFriendlyMessage(parsed));
      trackError(parsed, { source: "web", endpoint: "/api/admin/users/risk", userId: selected });
    }
  };

  const addFlag = async () => {
    if (!token || !selected) return;
    try {
      await api.post(`/api/admin/users/${selected}/flags?note=${encodeURIComponent(note)}`, {}, token);
      trackEvent("admin.users.flag_added", { source: "web", userId: selected });
      load();
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserFriendlyMessage(parsed));
      trackError(parsed, { source: "web", endpoint: "/api/admin/users/flags", userId: selected });
    }
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
        {error ? <div className="text-red-400 text-sm">{error}</div> : null}
        {users.length === 0 ? <div className="text-gray-400 text-sm">No users loaded.</div> : null}
        <div className="flex gap-2 items-center mt-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <div className="text-gray-300 text-sm">Page {page}</div>
          <Button variant="outline" disabled={users.length < limit} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
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
