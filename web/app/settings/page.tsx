'use client';

import { Protected } from "../../components/Protected";
import { DashboardShell } from "../../src/components/layout/DashboardShell";
import { Card } from "../../src/components/ui/card";
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { useAuth } from "../../lib/useAuth";

export default function SettingsPage() {
  const { logout } = useAuth();
  return (
    <Protected>
      <DashboardShell title="Settings" subtitle="Language, notifications, privacy, and profile.">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 bg-white/5 border-white/10 space-y-3">
            <div className="font-semibold text-white">Profile</div>
            <Input placeholder="Full name" />
            <Input placeholder="Email" />
            <Button size="sm">Save profile</Button>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10 space-y-3">
            <div className="font-semibold text-white">Preferences</div>
            <Input placeholder="Language (auto)" />
            <Input placeholder="Currency (NOK)" />
            <Button size="sm" variant="outline">
              Save preferences
            </Button>
          </Card>
          <Button variant="outline" onClick={logout} className="w-fit">
            Logout
          </Button>
        </div>
      </DashboardShell>
    </Protected>
  );
}
