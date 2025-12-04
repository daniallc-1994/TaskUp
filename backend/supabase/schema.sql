-- TaskUp Supabase schema per master spec.
-- NOTE: Assumes Supabase auth schema present. All tables enable RLS.

-- Enum types
do $$ begin
  create type public.user_role as enum ('client','tasker','admin','support','moderator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('new','offers_incoming','offer_accepted','in_progress','awaiting_client_confirmation','disputed','completed','refunded','payment_released','deactivated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.offer_status as enum ('pending','accepted','rejected','expired','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('escrowed','payment_released','refunded','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dispute_status as enum ('open','review','resolved_release','resolved_refund','dismissed');
exception when duplicate_object then null; end $$;

-- Users profile (linked to auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'client',
  rating numeric,
  hashed_password text,
  language text default 'en',
  currency text default 'NOK',
  stripe_connect_id text,
  is_blocked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  description text,
  budget_cents integer,
  currency text default 'NOK',
  status public.task_status default 'new',
  address text,
  lat double precision,
  lng double precision,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Offers
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  tasker_id uuid not null references public.user_profiles(id) on delete cascade,
  amount_cents integer not null,
  message text,
  eta_minutes integer,
  status public.offer_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages (chat)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  sender_id uuid not null references public.user_profiles(id) on delete cascade,
  recipient_id uuid not null references public.user_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Payments (escrow)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  payment_intent_id text,
  charge_id text,
  transfer_id text,
  refund_id text,
  status public.payment_status default 'escrowed',
  amount_cents integer not null,
  currency text default 'NOK',
  platform_fee_cents integer default 0,
  vat_cents integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Disputes
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  opened_by uuid not null references public.user_profiles(id),
  reason text,
  status public.dispute_status default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications (records)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Blocked users/devices
create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.device_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  fingerprint text not null,
  ip_address inet,
  created_at timestamptz default now()
);

-- Admin logs
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.user_profiles(id),
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.user_profiles(id),
  target_user_id uuid references public.user_profiles(id),
  target_task_id uuid references public.tasks(id),
  target_message_id uuid references public.messages(id),
  reason text,
  created_at timestamptz default now()
);

-- Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  favorite_user_id uuid references public.user_profiles(id),
  favorite_task_id uuid references public.tasks(id),
  created_at timestamptz default now()
);

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.user_profiles(id),
  referred_id uuid references public.user_profiles(id),
  code text,
  created_at timestamptz default now()
);

-- Availability (tasker)
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  tasker_id uuid not null references public.user_profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;
alter table public.disputes enable row level security;
alter table public.notifications enable row level security;
alter table public.blocked_users enable row level security;
alter table public.device_fingerprints enable row level security;
alter table public.admin_logs enable row level security;
alter table public.reports enable row level security;
alter table public.favorites enable row level security;
alter table public.referrals enable row level security;
alter table public.availability enable row level security;

-- Basic policies (simplified)
-- Profiles: owner read/update, admins all
create policy if not exists "profiles_self" on public.user_profiles
  for select using (auth.uid() = id or exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.role in ('admin','support','moderator')));
create policy if not exists "profiles_update_self" on public.user_profiles
  for update using (auth.uid() = id);

-- Tasks: client owns, taskers read
create policy if not exists "tasks_client" on public.tasks
  for all using (client_id = auth.uid() or exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.role in ('tasker','admin','support','moderator')));

-- Offers: tasker owns
create policy if not exists "offers_tasker" on public.offers
  for all using (tasker_id = auth.uid() or exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.role in ('admin','support','moderator')));

-- Messages: sender or recipient
create policy if not exists "messages_visible" on public.messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy if not exists "messages_write" on public.messages
  for insert with check (sender_id = auth.uid());

-- Payments: client/tasker/admin
create policy if not exists "payments_visible" on public.payments
  for select using (
    exists(select 1 from public.tasks t join public.offers o on o.task_id=t.id where payments.task_id=t.id and payments.offer_id=o.id and (t.client_id=auth.uid() or o.tasker_id=auth.uid()))
    or exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.role in ('admin','support','moderator'))
  );

-- Disputes: participants/admin
create policy if not exists "disputes_visible" on public.disputes
  for select using (
    opened_by = auth.uid()
    or exists(select 1 from public.tasks t where t.id = disputes.task_id and t.client_id = auth.uid())
    or exists(select 1 from public.offers o where o.id = disputes.payment_id)
    or exists(select 1 from public.user_profiles p where p.id = auth.uid() and p.role in ('admin','support','moderator'))
  );

-- Notifications: owner only
create policy if not exists "notifications_owner" on public.notifications
  for select using (user_id = auth.uid());

-- Favorites: owner
create policy if not exists "favorites_owner" on public.favorites
  for all using (user_id = auth.uid());

-- Availability: tasker owner
create policy if not exists "availability_owner" on public.availability
  for all using (tasker_id = auth.uid());
