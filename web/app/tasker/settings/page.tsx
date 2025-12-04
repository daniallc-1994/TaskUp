import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Input } from "../../../src/components/ui/input";
import { Button } from "../../../src/components/ui/button";

export default function TaskerSettings() {
  return (
    <Protected>
      <DashboardShell title="Tasker settings" subtitle="Configure availability, radius, skills, and notifications." variant="tasker">
        <Card className="p-4 bg-white/5 border-white/10 space-y-3">
          <Input placeholder="Radius (km)" />
          <Input placeholder="Primary skills" />
          <Button size="sm">Save tasker settings</Button>
        </Card>
      </DashboardShell>
    </Protected>
  );
}
