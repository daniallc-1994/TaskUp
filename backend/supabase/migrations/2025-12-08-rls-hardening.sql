-- RLS hardening and blocklist enrichment

-- Extend blocked_users with ip/device/expiry for abuse controls
alter table if exists public.blocked_users add column if not exists ip_address inet;
alter table if exists public.blocked_users add column if not exists device_id text;
alter table if exists public.blocked_users add column if not exists expires_at timestamptz;

-- Enable RLS where missing (idempotent)
alter table if exists public.transactions enable row level security;
alter table if exists public.wallets enable row level security;
alter table if exists public.fraud_flags enable row level security;

-- Helper: admin role check
create or replace view public._admin_uids as
select id from public.user_profiles where role in ('admin','support','moderator');

-- Users policies tighten update/insert
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'profiles_insert_self') then
    create policy profiles_insert_self on public.user_profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'profiles_admin_all') then
    create policy profiles_admin_all on public.user_profiles for all using (exists(select 1 from public._admin_uids a where a.id = auth.uid()));
  end if;
end$$;

-- Tasks: owner full, tasker/assigned read, admin all
do $$
begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='tasks_owner_all') then
    create policy tasks_owner_all on public.tasks for all using (client_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='tasks_tasker_read') then
    create policy tasks_tasker_read on public.tasks for select using (
      exists(select 1 from public.offers o where o.task_id = tasks.id and o.tasker_id = auth.uid())
      or assigned_tasker_id = auth.uid()
      or exists(select 1 from public._admin_uids a where a.id = auth.uid())
    );
  end if;
end$$;

-- Offers: owner or task owner read, owner insert/update, admin all
do $$
begin
  if not exists (select 1 from pg_policies where tablename='offers' and policyname='offers_owner_all') then
    create policy offers_owner_all on public.offers for all using (tasker_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='offers' and policyname='offers_task_owner_read') then
    create policy offers_task_owner_read on public.offers for select using (
      exists(select 1 from public.tasks t where t.id = offers.task_id and t.client_id = auth.uid())
      or exists(select 1 from public._admin_uids a where a.id = auth.uid())
    );
  end if;
end$$;

-- Messages: participants or admin
do $$
begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_participants') then
    create policy messages_participants on public.messages
      for select using (sender_id = auth.uid() or recipient_id = auth.uid() or exists(select 1 from public._admin_uids a where a.id=auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_insert_sender') then
    create policy messages_insert_sender on public.messages
      for insert with check (sender_id = auth.uid());
  end if;
end$$;

-- Payments/transactions: payer/payee/admin
do $$
begin
  if not exists (select 1 from pg_policies where tablename='payments' and policyname='payments_parties') then
    create policy payments_parties on public.payments
      for select using (
        client_id = auth.uid() or tasker_id = auth.uid() or exists(select 1 from public._admin_uids a where a.id=auth.uid())
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='transactions' and policyname='transactions_wallet_owner') then
    create policy transactions_wallet_owner on public.transactions
      for select using (
        exists(select 1 from public.wallets w where w.id = transactions.wallet_id and w.user_id = auth.uid())
        or exists(select 1 from public._admin_uids a where a.id=auth.uid())
      );
  end if;
end$$;

-- Wallets: owner/admin
do $$
begin
  if not exists (select 1 from pg_policies where tablename='wallets' and policyname='wallets_owner') then
    create policy wallets_owner on public.wallets for select using (user_id = auth.uid() or exists(select 1 from public._admin_uids a where a.id=auth.uid()));
  end if;
end$$;

-- Disputes: parties/admin
do $$
begin
  if not exists (select 1 from pg_policies where tablename='disputes' and policyname='disputes_parties') then
    create policy disputes_parties on public.disputes
      for select using (
        opened_by = auth.uid()
        or exists(select 1 from public.tasks t where t.id = disputes.task_id and t.client_id = auth.uid())
        or exists(select 1 from public.payments p where p.id = disputes.payment_id and p.tasker_id = auth.uid())
        or exists(select 1 from public._admin_uids a where a.id=auth.uid())
      );
  end if;
end$$;

-- Notifications: owner; admin optional
do $$
begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_owner') then
    create policy notifications_owner on public.notifications for select using (user_id = auth.uid());
  end if;
end$$;

-- Blocked users: admin only
do $$
begin
  if not exists (select 1 from pg_policies where tablename='blocked_users' and policyname='blocked_admin_only_all') then
    create policy blocked_admin_only_all on public.blocked_users
      for all using (exists(select 1 from public._admin_uids a where a.id = auth.uid()))
      with check (exists(select 1 from public._admin_uids a where a.id = auth.uid()));
  end if;
end$$;

-- Device fingerprints: owner/admin
do $$
begin
  if not exists (select 1 from pg_policies where tablename='device_fingerprints' and policyname='device_owner_select') then
    create policy device_owner_select on public.device_fingerprints
      for select using (user_id = auth.uid() or exists(select 1 from public._admin_uids a where a.id=auth.uid()));
  end if;
end$$;

-- Admin logs/fraud flags: admin only
do $$
begin
  if not exists (select 1 from pg_policies where tablename='admin_logs' and policyname='admin_logs_admin') then
    create policy admin_logs_admin on public.admin_logs
      for select using (exists(select 1 from public._admin_uids a where a.id=auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='fraud_flags' and policyname='fraud_flags_admin') then
    create policy fraud_flags_admin on public.fraud_flags
      for all using (exists(select 1 from public._admin_uids a where a.id=auth.uid()))
      with check (exists(select 1 from public._admin_uids a where a.id=auth.uid()));
  end if;
end$$;

comment on table public.blocked_users is 'Blocklist by user/ip/device; enforced in API and RLS.';
comment on table public.device_fingerprints is 'Device/IP fingerprints for fraud monitoring.';
