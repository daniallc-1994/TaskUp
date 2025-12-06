# TaskUp Backend – Supabase

Responsibilities:
- DB schema (tables & relations)
- SQL migrations
- RLS policies
- Functions / triggers
- Realtime channels
- Seed data (optional)

Core tables (minimum):
- users
- tasks
- offers
- messages
- payments
- disputes
- notifications
- blocked_users
- device_fingerprints
- admin_logs
- reports (user / task / message)
- favorites
- referrals
- availability (tasker calendar)

Supabase is the single source of truth for data. Enforce security with RLS.

## Working with Supabase CLI

If the `supabase` CLI is installed and authenticated:
- `supabase db push` - apply `schema.sql` and migrations to the linked project.
- `supabase db reset` - reset local dev DB and re-apply schema.
- `supabase migration new "<name>"` - create a migration from local changes.
- `supabase db seed` - run `seed.sql` / bundled seed migration to load demo data.

Structure:
- `schema.sql` - canonical schema (enums, tables, policies).
- `migrations/` - optional CLI-generated migration files.
- `reset_demo.sql` - truncates app tables and replays seed data (dev/staging only).
- `2025-12-08-rls-hardening.sql` - tighter policies, blocklist columns.

If the CLI is missing, install from https://supabase.com/docs/guides/cli and run the commands above once configured. Do not commit secrets; use local `.env` or dashboard configuration.
