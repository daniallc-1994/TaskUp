-- Additional RLS policies and indexes to cover spec tables

-- blocked_users (admin only)
alter table if exists public.blocked_users enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'blocked_users' and policyname = 'blocked_admin_only') then
    create policy blocked_admin_only on public.blocked_users
      for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'))
      with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
  end if;
end$$;

-- device_fingerprints (owner or admin)
alter table if exists public.device_fingerprints enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'device_fingerprints' and policyname = 'device_owner_or_admin') then
    create policy device_owner_or_admin on public.device_fingerprints
      for select using (
        user_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
      );
  end if;
end$$;

-- reports (owner or admin)
alter table if exists public.reports enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'reports_owner_admin') then
    create policy reports_owner_admin on public.reports
      for select using (
        reporter_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
      );
  end if;
end$$;

-- favorites (owner only)
alter table if exists public.favorites enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'favorites' and policyname = 'favorites_owner') then
    create policy favorites_owner on public.favorites
      for select using (user_id = auth.uid());
  end if;
end$$;

-- referrals (owner or admin)
alter table if exists public.referrals enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'referrals' and policyname = 'referrals_owner_admin') then
    create policy referrals_owner_admin on public.referrals
      for select using (
        referrer_id = auth.uid() or referee_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
      );
  end if;
end$$;

-- availability (tasker/admin)
alter table if exists public.availability enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'availability' and policyname = 'availability_owner_admin') then
    create policy availability_owner_admin on public.availability
      for select using (tasker_id = auth.uid() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
  end if;
end$$;

-- helpful indexes
create index if not exists idx_device_fingerprints_user on public.device_fingerprints(user_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_availability_tasker on public.availability(tasker_id);
