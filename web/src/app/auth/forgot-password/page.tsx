'use client';

import { useState } from 'react';
import { api } from '../../../../lib/api';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Card } from '../../../../src/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setMessage('If that email exists, reset instructions have been sent.');
    } catch (e: any) {
      setMessage(e?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card className="p-8 bg-black/70 border-white/10">
        <h1 className="text-2xl font-bold text-white mb-4">Forgot password</h1>
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
          {message && <div className="text-sm text-gray-200">{message}</div>}
        </div>
      </Card>
    </div>
  );
}
