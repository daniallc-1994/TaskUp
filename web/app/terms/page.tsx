import { PageShell } from "../../components/PageShell";

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" description="Rules for clients, taskers, and admins on TaskUp.">
      <div className="glass p-4 rounded-xl border border-white/10 space-y-3 text-gray-200 text-sm">
        <p>Use TaskUp only for lawful services. Payments must remain on-platform and use our escrow.</p>
        <p>Taskers must deliver within agreed timeline; clients confirm or dispute within the window. Admins may refund or release funds.</p>
        <p>Abuse, fraud, or off-platform transactions may lead to account termination and withheld funds.</p>
      </div>
    </PageShell>
  );
}
