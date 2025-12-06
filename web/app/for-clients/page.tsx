import type { Metadata } from "next";
import Script from "next/script";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";

const benefits = [
  { title: "Live offers in minutes", desc: "Post once, get multiple bids with price, ETA, and message." },
  { title: "Secure escrow", desc: "Funds are held until you mark the job received." },
  { title: "Verified taskers", desc: "Ratings, badges, and identity checks keep you safe." },
  { title: "Realtime chat", desc: "Coordinate with the accepted tasker inside TaskUp." },
];

export const metadata: Metadata = {
  title: "TaskUp for clients",
  description: "Post any job, get instant offers, and pay safely through escrow with TaskUp.",
};

export default function ForClientsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "TaskUp for clients",
    description: "Post tasks and receive offers with escrow and verified taskers.",
    provider: { "@type": "Organization", name: "TaskUp" },
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <Script id="ld-for-clients" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-black">TaskUp for clients</h1>
          <p className="text-gray-300">
            Post any job, get instant offers, and pay safely through escrow. TaskUp brings vetted taskers to you.
          </p>
          <div className="flex gap-3">
            <Link href="/tasks/new">
              <Button>Post a task</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline">See pricing</Button>
            </Link>
          </div>
        </div>
        <Card className="p-6 bg-white/5 border-white/10 space-y-3">
          {benefits.map((b) => (
            <div key={b.title}>
              <div className="text-lg font-semibold text-white">{b.title}</div>
              <p className="text-sm text-gray-300">{b.desc}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
