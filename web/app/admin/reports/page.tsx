import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";

const reports = [
  { id: "r1", reason: "Spam task", target: "Task #23" },
  { id: "r2", reason: "Abusive message", target: "User tasker@example.com" },
];

export default function AdminReports() {
  return (
    <Protected>
      <DashboardShell title="Reports" subtitle="User and content reports to moderate." variant="admin">
        <div className="space-y-2 text-sm text-gray-200">
          {reports.map((r) => (
            <Card key={r.id} className="p-3 bg-white/5 border-white/10 flex justify-between">
              <div>
                <div className="text-white font-semibold">{r.reason}</div>
                <div className="text-xs text-gray-400">{r.target}</div>
              </div>
              <span className="text-cyan-300">{r.id}</span>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </Protected>
  );
}
