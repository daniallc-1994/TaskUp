import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";

const logs = [
  { id: "l1", action: "block_user", actor: "admin@taskup.no" },
  { id: "l2", action: "refund", actor: "support@taskup.no" },
];

export default function AdminLogs() {
  return (
    <Protected>
      <DashboardShell title="Admin logs" subtitle="Every sensitive action is audited." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {logs.map((l) => (
            <Card key={l.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{l.action}</div>
                <div className="text-xs text-gray-400">{l.id}</div>
              </div>
              <span className="text-cyan-300">{l.actor}</span>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </Protected>
  );
}
