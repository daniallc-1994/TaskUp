-- Dev/Staging reset script. Truncates app tables and re-applies seed data.

-- WARNING: Do not run in production.

truncate table public.notifications cascade;
truncate table public.messages cascade;
truncate table public.disputes cascade;
truncate table public.payments cascade;
truncate table public.transactions cascade;
truncate table public.offers cascade;
truncate table public.tasks cascade;
truncate table public.wallets cascade;
truncate table public.blocked_users cascade;
truncate table public.device_fingerprints cascade;
truncate table public.admin_logs cascade;
truncate table public.reports cascade;
truncate table public.favorites cascade;
truncate table public.referrals cascade;
truncate table public.availability cascade;
truncate table public.fraud_flags cascade;
truncate table public.user_profiles cascade;

-- Re-run seed (assumes this file is executed from supabase db shell with working directory)
\i 2025-12-07-seed-data.sql
