'use client';

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="glass w-full max-w-md rounded-2xl p-6 border border-white/10 space-y-4">
        <h1 className="text-2xl font-bold text-white">Reset password</h1>
        {!submitted ? (
          <form className="space-y-4" onSubmit={onSubmit}>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 font-semibold"
            >
              Send reset link
            </button>
          </form>
        ) : (
          <div className="text-gray-200 text-sm">
            If an account exists, a reset link was sent to <span className="text-white font-semibold">{email}</span>.
          </div>
        )}
        <Link href="/auth/login" className="text-cyan-300 text-sm">
          Back to login
        </Link>
      </div>
    </div>
  );
}
