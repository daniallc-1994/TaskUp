import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";

export default function TaskerWallet() {
  return (
    <Protected>
      <DashboardShell title="Tasker wallet" subtitle="Payouts, balances, and Stripe Connect onboarding." variant="tasker">
        <div className="grid md:grid-cols-3 gap-4">
          {["Upcoming payout", "Available", "Total earned"].map((label, idx) => (
            <Card key={label} className="p-4 bg-white/5 border-white/10">
              <div className="text-sm text-gray-300">{label}</div>
              <div className="text-2xl font-black text-white">{idx === 0 ? "4 200 kr" : idx === 1 ? "9 800 kr" : "120 000 kr"}</div>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </Protected>
  );
}
