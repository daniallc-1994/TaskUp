'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";

function VerifyEmailInner() {
  const params = useSearchParams();
  const status = params.get("status");
  const message =
    status === "success"
      ? "Your email is verified. You can continue to your dashboard."
      : status === "error"
      ? "We could not verify your email. Please try again from the verification link."
      : "Check your inbox for a verification link.";

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Card className="p-6 bg-white/5 border-white/10 space-y-4 text-center">
        <h1 className="text-2xl font-black text-white">Verify email</h1>
        <p className="text-gray-300 text-sm">{message}</p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-300 py-10">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
