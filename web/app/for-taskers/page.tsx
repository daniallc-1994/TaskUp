import type { Metadata } from "next";
import Script from "next/script";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";

const perks = [
  { title: "Quality leads", desc: "Tasks matched to your skills, radius, and availability." },
  { title: "Instant payouts (Connect)", desc: "Escrowed jobs release to your wallet after client confirmation." },
  { title: "Ratings & badges", desc: "Build your reputation with verified and top-rated badges." },
  { title: "Protect your time", desc: "Clear offers, chat history, and dispute protection." },
];

export const metadata: Metadata = {
  title: "TaskUp for taskers",
  description: "Find nearby jobs, send offers, and get paid securely with TaskUp.",
};

export default function ForTaskersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "TaskUp for taskers",
    description: "Discover local tasks and earn with escrow payouts via Stripe Connect.",
    provider: { "@type": "Organization", name: "TaskUp" },
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <Script id="ld-for-taskers" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <Card className="p-6 bg-white/5 border-white/10 space-y-3">
          {perks.map((p) => (
            <div key={p.title}>
              <div className="text-lg font-semibold text-white">{p.title}</div>
              <p className="text-sm text-gray-300">{p.desc}</p>
            </div>
          ))}
        </Card>
        <div className="space-y-4">
          <h1 className="text-4xl font-black">TaskUp for taskers</h1>
          <p className="text-gray-300">
            Grow your business with steady, high-intent leads. Choose when and where you work, and get paid securely.
          </p>
          <div className="flex gap-3">
            <Link href="/tasker/tasks">
              <Button>Browse tasks</Button>
            </Link>
            <Link href="/auth/signup?role=tasker">
              <Button variant="outline">Become a tasker</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
