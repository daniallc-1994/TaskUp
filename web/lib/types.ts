export type Task = {
  id: string;
  title: string;
  description?: string | null;
  budget_cents?: number | null;
  currency?: string;
  status: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type Offer = {
  id: string;
  task_id: string;
  tasker_id: string;
  amount_cents: number;
  message?: string | null;
  status: string;
  eta_minutes?: number | null;
};

export type Message = {
  id: string;
  task_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at?: string;
};

export type Payment = {
  id: string;
  task_id: string;
  offer_id: string;
  status: string;
  amount_cents: number;
  currency?: string;
  payment_intent_id?: string | null;
  transfer_id?: string | null;
  refund_id?: string | null;
};

export type Dispute = {
  id: string;
  task_id: string;
  payment_id: string;
  opened_by: string;
  reason: string;
  status: string;
};
