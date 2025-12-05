import { PageShell } from "../../../components/PageShell";

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" description="Rules for clients, taskers, and admins on TaskUp.">
      <div className="glass p-4 rounded-xl border border-white/10 text-sm text-gray-200 space-y-3">
        <p>You must be 18+ to use TaskUp. By posting or accepting tasks you enter a contract governed by Norwegian/EU law.</p>
        <p>Payments are processed via Stripe (escrow) and may include VAT and platform fees. Funds are held until completion or dispute resolution.</p>
        <p>TaskUp may suspend accounts for fraud, abuse, or policy violations. Admin decisions on disputes aim to be fair and logged for audit.</p>
      </div>
    </PageShell>
  );
}
