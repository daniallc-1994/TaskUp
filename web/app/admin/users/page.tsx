'use client';

import { useEffect, useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";

type AdminUser = { email: string; role: string; status?: string; id: string };

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/admin/users", token)
      .then((res) => setUsers(res || []))
      .catch((err) => console.error("admin users", err));
  }, [token]);

  return (
    <Protected role="admin">
      <DashboardShell title="Users" subtitle="Manage roles, bans, verification, and audits." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {users.map((u) => (
            <Card key={u.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{u.email}</div>
                <div>{u.role}</div>
              </div>
              <span className="text-cyan-300">{u.status || "active"}</span>
            </Card>
          ))}
          {users.length === 0 ? <div className="text-gray-400 text-sm">No users loaded.</div> : null}
        </div>
      </DashboardShell>
    </Protected>
  );
}
