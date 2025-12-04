import { Card } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white">Contact</h1>
        <p className="text-gray-300">Reach the TaskUp team for support, partnerships, or press.</p>
      </div>
      <Card className="p-6 bg-white/5 border-white/10 space-y-3">
        <Input placeholder="Your email" />
        <Input placeholder="Subject" />
        <textarea
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
          rows={4}
          placeholder="How can we help?"
        />
        <Button>Send</Button>
      </Card>
    </div>
  );
}
