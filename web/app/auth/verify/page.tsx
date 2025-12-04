'use client';

import { useState } from "react";
import Link from "next/link";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "ok">("idle");

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="glass w-full max-w-md rounded-2xl p-6 border border-white/10 space-y-4">
        <h1 className="text-2xl font-bold text-white">Verify your email</h1>
        <p className="text-gray-300 text-sm">Enter the code we sent you to verify your account.</p>
        {status === "idle" ? (
          <>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setStatus("ok")}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 font-semibold"
            >
              Confirm
            </button>
          </>
        ) : (
          <div className="text-green-400 text-sm">Verified! You can now log in.</div>
        )}
        <Link href="/auth/login" className="text-cyan-300 text-sm">
          Back to login
        </Link>
      </div>
    </div>
  );
}
