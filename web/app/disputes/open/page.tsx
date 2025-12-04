'use client';

import { useState } from "react";
import { Protected } from "../../../components/Protected";
import { DashboardShell } from "../../../src/components/layout/DashboardShell";
import { Card } from "../../../src/components/ui/card";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";

export default function OpenDisputePage() {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    setSubmitted(true);
  };

  return (
    <Protected>
      <DashboardShell title="Open a dispute" subtitle="Funds stay in escrow until an admin decides.">
        <Card className="p-6 bg-white/5 border-white/10 space-y-4">
          <div>
            <label className="text-sm text-gray-300">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the issue" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Details</label>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add screenshots or evidence in the next step."
            />
          </div>
          <Button onClick={submit}>Submit dispute</Button>
          {submitted ? <div className="text-green-300 text-sm">Dispute recorded locally.</div> : null}
        </Card>
      </DashboardShell>
    </Protected>
  );
}
