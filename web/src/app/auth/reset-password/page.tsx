'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Card } from '../../../../src/components/ui/card';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password });
      setMessage('Password has been reset. You can now log in.');
    } catch (e: any) {
      setMessage(e?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card className="p-8 bg-black/70 border-white/10">
        <h1 className="text-2xl font-bold text-white mb-4">Reset password</h1>
        <div className="space-y-3">
          <label className="text-sm text-gray-300">New password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Reset password'}
          </Button>
          {message && <div className="text-sm text-gray-200">{message}</div>}
        </div>
      </Card>
    </div>
  );
}
