import { PageShell } from "../../components/PageShell";

export default function CookiesPage() {
  return (
    <PageShell title="Cookie Policy" description="How TaskUp uses cookies and similar technologies.">
      <div className="glass p-4 rounded-xl border border-white/10 space-y-3 text-gray-200 text-sm">
        <p>We use cookies for authentication, session management, and basic analytics. No tracking cookies beyond platform operation.</p>
        <p>You can clear cookies to log out. Critical cookies are required for secure sessions and escrow flows.</p>
      </div>
    </PageShell>
  );
}
