import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";

const analytics = [
  { label: "Tasks today", value: "84" },
  { label: "Offers sent", value: "320" },
  { label: "Gross volume", value: "152 000 kr" },
];

export default function AdminAnalytics() {
  return (
    <Protected>
      <DashboardShell title="Analytics" subtitle="High-level overview of platform metrics." variant="admin">
        <div className="grid md:grid-cols-3 gap-4">
          {analytics.map((a) => (
            <Card key={a.label} className="p-4 bg-white/5 border-white/10">
              <div className="text-sm text-gray-300">{a.label}</div>
              <div className="text-xl font-black text-white">{a.value}</div>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </Protected>
  );
}
