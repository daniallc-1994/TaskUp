import { PageShell } from "../../../components/PageShell";

export default function CookiesPage() {
  return (
    <PageShell title="Cookie Policy" description="How TaskUp uses cookies and similar technologies.">
      <div className="glass p-4 rounded-xl border border-white/10 text-sm text-gray-200 space-y-3">
        <p>We use essential cookies for login sessions and optional cookies for analytics and performance.</p>
        <p>You can manage consent in the cookie banner. Declining analytics will disable GA tracking.</p>
      </div>
    </PageShell>
  );
}
