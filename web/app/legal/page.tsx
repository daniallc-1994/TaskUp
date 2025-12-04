import { PageShell } from "../../components/PageShell";
import Link from "next/link";

const links = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

export default function LegalPage() {
  return (
    <PageShell title="Legal" description="Important legal documents for using TaskUp.">
      <div className="grid md:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="glass p-4 rounded-xl border border-white/10 hover:border-white/30">
            <h3 className="text-white font-semibold">{l.label}</h3>
            <p className="text-gray-300 text-sm mt-2">View details</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
