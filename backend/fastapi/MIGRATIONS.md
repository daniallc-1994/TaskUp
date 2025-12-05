# TaskUp FastAPI / SQLAlchemy Changes (manual notes)

This file tracks schema-affecting changes that must be reflected in the database (Supabase/Postgres) via migrations/DDL.

## 2025-12-05
- Rename `admin_logs.metadata` column to `admin_logs.details` (reserved name fix).
  - Update existing data: `ALTER TABLE admin_logs RENAME COLUMN metadata TO details;`
- Ensure `admin_logs` is present with columns: `id, admin_id, action, entity, entity_id, details JSONB, created_at`.
- No automatic migration tool is wired yet; apply the SQL above in your DB migration system (Supabase migration or Alembic).
- Seed/demo data provided in `backend/supabase/seed.sql` for local/staging.

## Pending RLS / Supabase alignment
- Create RLS policies for tables (users, tasks, offers, payments, transactions, disputes, messages, notifications) matching roles:
  - Clients: only own tasks/payments/messages/notifications.
  - Taskers: tasks they’re assigned to; their offers; their wallet/transactions.
  - Admin/support/moderator: full access.
- Add migrations to create indexes on FK columns (task_id, user_id, offer_id) for performance.
- Stripe Connect onboarding: add a column `stripe_connect_account_id` to users (present in models) and ensure it is populated via onboarding flow.

> Keep this file updated as you add schema changes. Every breaking/DB change should be documented with SQL snippets and rollback considerations.
