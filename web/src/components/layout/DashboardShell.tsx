import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

type Variant = "client" | "tasker" | "admin";

const menus: Record<Variant, { href: string; label: string }[]> = {
  client: [
    { href: "/dashboard", label: "Overview" },
    { href: "/tasks", label: "Tasks" },
    { href: "/messages", label: "Messages" },
    { href: "/wallet", label: "Wallet" },
    { href: "/settings", label: "Settings" },
  ],
  tasker: [
    { href: "/tasker", label: "Overview" },
    { href: "/tasker/tasks", label: "Nearby tasks" },
    { href: "/tasker/offers", label: "Offers" },
    { href: "/tasker/wallet", label: "Earnings" },
    { href: "/tasker/settings", label: "Settings" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/tasks", label: "Tasks" },
    { href: "/admin/offers", label: "Offers" },
    { href: "/admin/disputes", label: "Disputes" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/logs", label: "Logs" },
    { href: "/admin/analytics", label: "Analytics" },
  ],
};

export function DashboardShell({
  title,
  subtitle,
  variant = "client",
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  variant?: Variant;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const menu = menus[variant];
  return (
    <div className="relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-10 w-64 h-64 rounded-full bg-[#8B5CFF]/15 blur-3xl" />
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-[#24c0f7]/12 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 space-y-4">
            <Card className="p-4 glass">
              <div className="text-sm text-gray-400 font-semibold mb-2 uppercase tracking-wide">{variant} menu</div>
              <div className="space-y-2">
                {menu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  >
                    <span>{item.label}</span>
                    <Badge className="bg-[#8B5CFF]/20 text-purple-100 border-[#8B5CFF]/40">Go</Badge>
                  </Link>
                ))}
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#8B5CFF]/30 to-[#24c0f7]/20 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <div className="text-lg font-bold mb-2">Need help?</div>
              <p className="text-sm text-gray-200 mb-3">Chat with support or open a dispute from any order room.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages">Open chat</Link>
              </Button>
            </Card>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-white">{title}</h1>
                {subtitle ? <p className="text-gray-300">{subtitle}</p> : null}
              </div>
              {actions}
            </div>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
