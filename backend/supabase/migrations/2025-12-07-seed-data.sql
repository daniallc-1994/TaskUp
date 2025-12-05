-- Seed data promoted into migration so it can run via `supabase db push`
-- Mirrors backend/supabase/seed.sql

-- Users
insert into users (id, email, hashed_password, full_name, role, language)
values
  ('client-1', 'client1@example.com', 'hashed_pw', 'Client One', 'client', 'en'),
  ('client-2', 'client2@example.com', 'hashed_pw', 'Client Two', 'nb', 'nb'),
  ('client-3', 'client3@example.com', 'hashed_pw', 'Client Three', 'client', 'sv'),
  ('tasker-1', 'tasker1@example.com', 'hashed_pw', 'Tasker One', 'tasker', 'en'),
  ('tasker-2', 'tasker2@example.com', 'hashed_pw', 'Tasker Two', 'tasker', 'nb'),
  ('tasker-3', 'tasker3@example.com', 'hashed_pw', 'Tasker Three', 'tasker', 'sv')
on conflict (id) do nothing;

-- Wallets
insert into wallets (id, user_id, available_balance, escrow_balance, currency)
values
  ('wallet-client-1', 'client-1', 100000, 0, 'NOK'),
  ('wallet-tasker-1', 'tasker-1', 0, 0, 'NOK'),
  ('wallet-tasker-2', 'tasker-2', 0, 0, 'NOK')
on conflict (id) do nothing;

-- Tasks
insert into tasks (id, client_id, title, description, category, budget_min, budget_max, currency, status, created_at)
values
  ('task-new', 'client-1', 'Assemble desk', 'Assemble IKEA desk', 'Handyman', 10000, 15000, 'NOK', 'open', now()),
  ('task-offers', 'client-1', 'Deep clean', 'Deep clean 2BR', 'Cleaning', 20000, 25000, 'NOK', 'offers_incoming', now()),
  ('task-accepted', 'client-2', 'Move boxes', 'Move boxes to storage', 'Moving', 30000, 35000, 'NOK', 'in_progress', now()),
  ('task-disputed', 'client-3', 'Fix wifi', 'Troubleshoot wifi', 'Tech', 15000, 20000, 'NOK', 'disputed', now())
on conflict (id) do nothing;

-- Offers
insert into offers (id, task_id, tasker_id, amount, currency, message, status, created_at)
values
  ('offer-1', 'task-offers', 'tasker-1', 22000, 'NOK', 'Can do tomorrow', 'pending', now()),
  ('offer-2', 'task-offers', 'tasker-2', 21000, 'NOK', 'Available today', 'pending', now()),
  ('offer-accepted', 'task-accepted', 'tasker-1', 32000, 'NOK', 'Move in evening', 'accepted', now())
on conflict (id) do nothing;

-- Payments (escrowed/released/refunded)
insert into payments (id, task_id, offer_id, client_id, tasker_id, wallet_id, amount, currency, status, created_at)
values
  ('pay-escrow', 'task-accepted', 'offer-accepted', 'client-2', 'tasker-1', 'wallet-client-1', 32000, 'NOK', 'escrowed', now()),
  ('pay-refunded', 'task-disputed', 'offer-1', 'client-3', 'tasker-2', 'wallet-client-1', 18000, 'NOK', 'refunded', now())
on conflict (id) do nothing;

-- Transactions
insert into transactions (id, wallet_id, type, amount, currency, status, created_at)
values
  ('tx-topup-1', 'wallet-client-1', 'topup', 100000, 'NOK', 'succeeded', now()),
  ('tx-escrow-1', 'wallet-client-1', 'escrow_hold', 32000, 'NOK', 'succeeded', now()),
  ('tx-refund-1', 'wallet-client-1', 'refund', 18000, 'NOK', 'succeeded', now())
on conflict (id) do nothing;

-- Disputes
insert into disputes (id, task_id, raised_by_id, against_user_id, reason, description, status, created_at)
values
  ('dispute-1', 'task-disputed', 'client-3', 'tasker-2', 'Did not fix wifi', 'Connection still down', 'open', now())
on conflict (id) do nothing;

-- Messages
insert into messages (id, task_id, sender_id, receiver_id, content, created_at)
values
  ('msg-1', 'task-accepted', 'client-2', 'tasker-1', 'Hi, can you arrive at 6pm?', now()),
  ('msg-2', 'task-accepted', 'tasker-1', 'client-2', 'Yes, see you then.', now())
on conflict (id) do nothing;
