import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";

const features = [
  { title: "Live offers", desc: "Taskers bid in real-time with price and ETA." },
  { title: "Escrow payments", desc: "Stripe Connect holds funds until delivery." },
  { title: "Order room", desc: "Chat, status timeline, confirm or dispute." },
  { title: "Admin panel", desc: "Moderation, payouts, reports, and audits." },
];

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white">Features</h1>
        <p className="text-gray-300">Everything you need for safe tasking.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {features.map((f) => (
          <Card key={f.title} className="p-6 bg-white/5 border-white/10">
            <div className="text-lg font-bold text-white mb-2">{f.title}</div>
            <p className="text-sm text-gray-300">{f.desc}</p>
          </Card>
        ))}
      </div>
      <Button asChild>
        <Link href="/auth/signup">Get started</Link>
      </Button>
    </div>
  );
}
