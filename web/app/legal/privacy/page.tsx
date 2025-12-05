import { PageShell } from "../../../components/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" description="How we handle your data, GDPR compliance, and user rights.">
      <div className="glass p-4 rounded-xl border border-white/10 text-sm text-gray-200 space-y-3">
        <p>We collect account, task, offer, and payment data to operate TaskUp. We rely on providers like Stripe and Supabase to process data securely.</p>
        <p>Under GDPR you can request access or deletion of your data. Some records (payments, disputes, logs) may be retained for legal obligations.</p>
        <p>We store device/IP for fraud prevention and consent preferences for cookies/analytics.</p>
      </div>
    </PageShell>
  );
}
