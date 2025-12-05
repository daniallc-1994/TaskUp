import { PageShell } from "../../../components/PageShell";

export default function DisputesPage() {
  return (
    <PageShell title="Dispute & Refund Policy" description="How disputes are handled and funds are released or refunded.">
      <div className="glass p-4 rounded-xl border border-white/10 text-sm text-gray-200 space-y-3">
        <p>When a client opens a dispute, funds stay in Stripe escrow until an admin decides to release to the tasker or refund the client.</p>
        <p>Decisions consider chat history, proof of delivery, and platform guidelines. Admin actions are audited; refunds may include processing timelines from providers.</p>
        <p>Chargebacks or disputes via payment providers may incur delays or additional verification.</p>
      </div>
    </PageShell>
  );
}
