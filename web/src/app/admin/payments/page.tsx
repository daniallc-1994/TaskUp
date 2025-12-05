'use client';

import useSWR from 'swr';
import { api } from '../../../../lib/api';
import { Card } from '../../../../src/components/ui/card';
import { Badge } from '../../../../src/components/ui/badge';

const fetcher = (url: string) => api.get(url);

export default function AdminPaymentsPage() {
  const { data } = useSWR('/api/admin/payments', fetcher);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Payments</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {(data?.payments || []).map((p: any) => (
          <Card key={p.id} className="p-4 bg-black/60 border-white/10">
            <div className="flex justify-between">
              <div className="text-white font-semibold">{p.id}</div>
              <Badge>{p.status}</Badge>
            </div>
            <div className="text-sm text-gray-300 mt-2">
              Amount: {(p.amount || p.amount_cents || 0) / 100} {p.currency || 'NOK'}
            </div>
            <div className="text-sm text-gray-300">Task: {p.task_id}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
