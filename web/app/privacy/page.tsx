import { PageShell } from "../../components/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" description="How we handle your data, GDPR compliance, and user rights.">
      <div className="glass p-4 rounded-xl border border-white/10 space-y-3 text-gray-200 text-sm">
        <p>We store only what is necessary to operate the platform: account details, tasks, offers, chat, payments, and logs.</p>
        <p>Stripe handles payment details; we do not store card numbers. Supabase stores application data with RLS enforced.</p>
        <p>You can request data export or deletion via support. Cookies are used for auth/session only.</p>
      </div>
    </PageShell>
  );
}
