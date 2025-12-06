import type { Metadata } from "next";
import { Card } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import Link from "next/link";

const categories = [
  { name: "Cleaning", desc: "Apartments, offices, deep clean", tasks: "3.2K" },
  { name: "Moving", desc: "Transport, packing, furniture", tasks: "1.9K" },
  { name: "Handyman", desc: "Repairs, mounting, assembly", tasks: "2.4K" },
  { name: "Tech", desc: "Wi-Fi, PC/Mac, smart home", tasks: "1.1K" },
  { name: "Delivery", desc: "Groceries, parcels, urgent runs", tasks: "2.7K" },
  { name: "Creative", desc: "Design, photo, content", tasks: "0.9K" },
];

export const metadata: Metadata = {
  title: "TaskUp | Categories",
  description: "Browse popular TaskUp categories to reach the right taskers faster.",
};

export default function CategoriesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Browse by need</Badge>
        <h1 className="text-4xl font-black">Popular categories</h1>
        <p className="text-gray-300">Pick a category to pre-fill your task and reach the right taskers faster.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.name} className="p-5 bg-white/5 border-white/10 hover:border-purple-300/50 transition">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-white">{c.name}</div>
              <span className="text-xs text-gray-400">{c.tasks} tasks</span>
            </div>
            <p className="text-sm text-gray-300 mb-3">{c.desc}</p>
            <Link href="/tasks/new" className="text-purple-300 text-sm font-semibold">
              Create a {c.name.toLowerCase()} task →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
