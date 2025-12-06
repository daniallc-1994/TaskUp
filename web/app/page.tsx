import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { Button } from "../src/components/ui/button";
import { Card } from "../src/components/ui/card";
import { Badge } from "../src/components/ui/badge";

const stats = [
  { value: "10K+", label: "Tasks Completed" },
  { value: "4.9★", label: "Average Rating" },
  { value: "5K+", label: "Verified Taskers" },
  { value: "50+", label: "Cities" },
];

const categories = [
  { name: "Handyman", count: "2.5K+" },
  { name: "Cleaning", count: "3.2K+" },
  { name: "Moving", count: "1.8K+" },
  { name: "Delivery", count: "4.1K+" },
  { name: "Creative", count: "1.2K+" },
  { name: "Tech", count: "2.9K+" },
];

const steps = [
  { title: "Post your task", desc: "Describe the job, budget, and timing." },
  { title: "Get offers", desc: "Taskers nearby bid with price, ETA, and message." },
  { title: "Pay in escrow", desc: "Secure Stripe escrow until you confirm delivery." },
];

export const metadata: Metadata = {
  title: "TaskUp | Get any task done fast",
  description: "Secure escrow, live offers, realtime chat for clients and taskers.",
  openGraph: {
    title: "TaskUp | Get any task done fast",
    description: "Secure escrow, live offers, realtime chat for clients and taskers.",
    url: "https://taskup.no",
    siteName: "TaskUp",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TaskUp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskUp | Get any task done fast",
    description: "Secure escrow, live offers, realtime chat for clients and taskers.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "TaskUp",
    url: "https://taskup.no",
    description: "Marketplace for clients and taskers with escrow payments and realtime chat.",
    areaServed: "NO",
    serviceType: ["Cleaning", "Moving", "Handyman", "Tech support", "Delivery"],
    provider: {
      "@type": "Organization",
      name: "TaskUp",
      url: "https://taskup.no",
    },
  };

  return (
    <div className="relative">
      <Script
        id="ld-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="afterInteractive"
      />
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Trusted by 10,000+ Norwegians</Badge>
            <h1 className="text-5xl lg:text-6xl font-black leading-tight">
              Get Any Task
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Done Fast
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Connect with verified taskers for everything from cleaning to tech support. Post your task and get offers in
              minutes with secure escrow payments.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/signup">
                <Button size="lg">Post a Task Now</Button>
              </Link>
              <Link href="/tasker">
                <Button size="lg" variant="outline">
                  Become a Tasker
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-4 text-center bg-white/5 border-white/10">
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 font-semibold">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-6 border-2 border-purple-500/20 bg-black/60">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Sign in to TaskUp</h3>
                <p className="text-gray-400 text-sm">Access dashboard, offers, and chat.</p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full">Sign In</Button>
              </Link>
              <div className="text-center text-gray-400 text-sm">
                New here?{" "}
                <Link href="/auth/signup" className="text-purple-300 font-semibold">
                  Create an account
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black">Browse by category</h2>
              <p className="text-gray-300">Thousands of verified taskers ready to help</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Popular</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Card key={c.name} className="p-4 text-center hover:border-purple-400/50 transition">
                <div className="font-bold text-white">{c.name}</div>
                <div className="text-sm text-gray-400">{c.count} taskers</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16 space-y-8">
        <div className="text-center space-y-2">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Simple Process</Badge>
          <h2 className="text-4xl font-black">How TaskUp works</h2>
          <p className="text-gray-300">Get your task done in 3 easy steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s, idx) => (
            <Card key={s.title} className="p-6 border-white/10">
              <div className="text-lg font-bold text-white mb-2">
                {idx + 1}. {s.title}
              </div>
              <p className="text-gray-300 text-sm">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
