import { PageShell } from "../../components/PageShell";

const steps = [
  { title: "Post a task", detail: "Describe the job, budget, location, and timing." },
  { title: "Get live offers", detail: "Taskers nearby bid with price, ETA, and message." },
  { title: "Escrow & chat", detail: "Pay into Stripe escrow, coordinate in chat/order room." },
  { title: "Confirm or dispute", detail: "Mark received to release funds or open a dispute." },
];

export default function HowItWorksPage() {
  return (
    <PageShell
      title="How TaskUp works"
      description="Escrow-first marketplace with transparent offers, realtime chat, and dispute resolution."
      actions={[{ label: "Get started", href: "/auth/signup" }]}
    >
      <div className="grid md:grid-cols-2 gap-4">
        {steps.map((s) => (
          <div key={s.title} className="glass p-4 rounded-xl border border-white/10">
            <h3 className="text-white font-semibold text-lg">{s.title}</h3>
            <p className="text-gray-300 text-sm mt-2">{s.detail}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
