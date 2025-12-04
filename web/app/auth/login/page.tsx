'use client';

import Link from "next/link";
import { useState, FormEvent } from "react";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Card } from "../../../src/components/ui/card";
import { useAuth } from "../../../lib/useAuth";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (!res.ok) setError(res.message || "Login failed. Check your credentials.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white">Welcome back</h1>
        <p className="text-gray-300 text-lg">Sign in to access your dashboard, offers, chat, and wallet.</p>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>- Live offers in minutes</li>
          <li>- Secure escrow payments</li>
          <li>- Realtime chat and order rooms</li>
        </ul>
      </div>
      <Card className="p-8 border-white/15 bg-black/70">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Working..." : "Sign In"}
          </Button>
        </form>
        <div className="flex justify-between text-sm text-gray-400 mt-4">
          <Link href="/auth/forgot-password" className="text-purple-300">
            Forgot password?
          </Link>
          <Link href="/auth/signup" className="text-purple-300">
            Create account
          </Link>
        </div>
      </Card>
    </div>
  );
}
