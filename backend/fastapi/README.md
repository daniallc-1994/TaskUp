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
