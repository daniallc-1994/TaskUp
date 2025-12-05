'use client';

import useSWR from 'swr';
import { api } from '../../../../lib/api';
import { Card } from '../../../../src/components/ui/card';
import { Badge } from '../../../../src/components/ui/badge';

const fetcher = (url: string) => api.get(url);

export default function AdminDisputesPage() {
  const { data } = useSWR('/api/disputes', fetcher);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Disputes</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {(data || []).map((d: any) => (
          <Card key={d.id} className="p-4 bg-black/60 border-white/10">
            <div className="flex justify-between items-center">
              <div className="text-white font-semibold">{d.reason}</div>
              <Badge>{d.status}</Badge>
            </div>
            <div className="text-sm text-gray-300 mt-2">Task: {d.task_id}</div>
            <div className="text-sm text-gray-300">Raised by: {d.raised_by_id}</div>
            <div className="text-sm text-gray-300">Against: {d.against_user_id}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
