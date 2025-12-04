import { PageShell } from "../../components/PageShell";

const faqs = [
  { q: "How does escrow work?", a: "Client pays into Stripe escrow when accepting an offer. Funds release only after confirmation or admin decision." },
  { q: "How are disputes handled?", a: "Open a dispute in the order room. Admin reviews and can release to tasker or refund the client." },
  { q: "Do you support multiple languages?", a: "Yes, i18n with manual override and locale detection on web and mobile." },
  { q: "How do taskers get paid?", a: "Through Stripe Connect. Payouts initiated after funds are released." },
];

export default function FAQPage() {
  return (
    <PageShell title="FAQ" description="Answers to the most common TaskUp questions.">
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.q} className="glass p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-semibold">{f.q}</h3>
            <p className="text-gray-300 text-sm mt-2">{f.a}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
