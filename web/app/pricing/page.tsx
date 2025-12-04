import { PageShell } from "../../components/PageShell";

const tiers = [
  { name: "Client", price: "Free", features: ["Post unlimited tasks", "Pay-per-escrow", "Dispute support"] },
  { name: "Tasker", price: "0,-/mo", features: ["Send offers", "Chat/order room", "Stripe Connect payouts"] },
  { name: "Enterprise", price: "Custom", features: ["Admin APIs", "SLAs", "Dedicated support"] },
];

export default function PricingPage() {
  return (
    <PageShell title="Pricing" description="Simple, escrow-based pricing with platform fees on payouts.">
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div key={t.name} className="glass p-4 rounded-xl border border-white/10">
            <h3 className="text-white text-lg font-semibold">{t.name}</h3>
            <p className="text-2xl text-white font-bold mt-2">{t.price}</p>
            <ul className="mt-3 space-y-1 text-sm text-gray-300">
              {t.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
