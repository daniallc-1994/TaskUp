# TaskUp Backend – FastAPI (Railway)

Responsibilities:
- Stripe webhooks:
  - payment_intent.succeeded / failed
  - transfer.created
  - charge.dispute.created
  - refund-related events
- Escrow logic:
  - create & confirm PaymentIntents
  - keep funds in escrow
  - release funds to tasker
  - refund client
- Admin APIs:
  - manual release/refund
  - user moderation (block/unblock)
  - view disputes & analytics
- Notifications:
  - send push (Expo)
  - send email
  - send SMS (optional)
- Scheduled jobs:
  - expire old tasks & offers
  - cleanup
  - fraud checks
  - backups

Env vars (backend/fastapi/.env):

SUPABASE_URL=...  
SUPABASE_SERVICE_ROLE_KEY=...  
DATABASE_URL=...  
STRIPE_SECRET_KEY=...  
STRIPE_WEBHOOK_SECRET=...  
JWT_SECRET=...  
SENTRY_DSN=...  
EMAIL_PROVIDER_API_KEY=...  
SMS_PROVIDER_API_KEY=...  
EXPO_PUSH_API_URL=...  

Log all admin-sensitive actions in admin_logs.

Entry points:
- Local dev: `uvicorn backend.fastapi_main:app --reload` (run from repo root)
- Module run: `python -m backend.fastapi_main`
- App factory: `backend.fastapi.app_core.app:create_app`

API prefixes:
- Primary: `/api` (e.g., `/api/auth/register`, `/api/tasks`)
- Legacy compatibility: `/auth/*` still works for auth only

Quick local auth test:

```bash
uvicorn backend.fastapi_main:app --reload

curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234","full_name":"Test User","role":"client","language":"en"}'

curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}'
```

Environment variables (set via Render/host, not committed):
- `DATABASE_URL` – Postgres connection
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role for RLS-aware operations
- `JWT_SECRET` – signing key for access tokens
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` – payments + webhooks
- `SENTRY_DSN` – optional error reporting
- `EMAIL_PROVIDER_API_KEY` / `SMS_PROVIDER_API_KEY` – optional notifications
- `EXPO_PUSH_API_URL` – Expo push service endpoint
- `CORS` values controlled in `backend/fastapi/app_core/config.py`
