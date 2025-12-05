# TaskUp Backend – Supabase + FastAPI (Railway)

Backend responsibilities:

- Database: Supabase (Postgres)
- Auth & RLS: Supabase
- Storage: Supabase Storage
- Realtime: Supabase Realtime
- API & business logic: FastAPI on Railway
- Stripe webhooks & escrow logic
- Notifications (push/email/SMS)
- Fraud detection & rate limiting
- Admin operations & logs
- Backups & disaster recovery

Subfolders (canonical):

backend/
├── README.md
├── supabase/    ← schema + migrations
└── fastapi/     ← FastAPI service (entrypoint: `backend.fastapi_main:app`)
