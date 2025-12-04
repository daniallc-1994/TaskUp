# TaskUp Web – Next.js App for https://taskup.no

This is the **web frontend** for TaskUp.

Responsibilities:
- Public site at **https://taskup.no**
- Web app for:
  - clients (post tasks, see offers, chat, pay, rate)
  - taskers (get tasks, send offers, chat, see earnings)
  - **Admin panel** (moderation, dispute handling, payments, analytics).
- SEO, legal pages, cookies, localization, accessibility.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (or similar)
- React Query / TanStack Query
- Supabase JS client + REST calls to FastAPI
- Supabase Auth (email/password)
- Stripe JS (PaymentIntents + Connect)
- next-i18next (or equivalent) for i18n
- Vercel deployment with domain taskup.no via GoDaddy DNS

## Folder structure (example)

web/
├── README.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   ├── icons/
│   └── i18n/ (optional)
├── src/
│   ├── app/
│   │   ├── (marketing)/ ← landing routes (/, /how-it-works, etc.)
│   │   ├── (auth)/ ← /login, /signup, /forgot-password
│   │   ├── (dashboard)/ ← /dashboard, /tasks, /wallet, /messages, /profile
│   │   ├── admin/ ← /admin, /admin/users, /admin/tasks, /admin/disputes
│   │   └── api/ ← minimal route handlers if really needed
│   ├── components/ ← reusable UI
│   ├── features/ ← tasks, offers, chat, wallet, profile, admin
│   ├── lib/ ← supabase client, API client, stripe, analytics
│   ├── hooks/ ← custom hooks
│   ├── styles/ ← Tailwind / global styles
│   └── i18n/ ← i18n config / helpers
└── .env.local ← NOT committed

## Env vars (web/.env.local)

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL  
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY  
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN  
NEXT_PUBLIC_GA_ID=YOUR_GOOGLE_ANALYTICS_ID  
NEXT_PUBLIC_API_BASE_URL=https://YOUR-RAILWAY-API-BASE-URL  

## Web responsibilities

- Landing & marketing:
  - SEO
  - OG images
  - sitemap.xml, robots.txt
  - Schema.org
  - Cookie banner (GDPR)
- Auth:
  - login
  - signup (role: client / tasker)
  - forgot password
  - email verification flows
  - Terms + Privacy + 18+ acceptance (stored in DB with timestamp)
- Client dashboard:
  - Home: main CTA “Get Offers Now” → Custom Task
  - Categories (secondary)
  - Create Task flow
  - Live Offers feed (realtime)
  - Accept offer → call backend to create Stripe escrow
  - Chat
  - Wallet view
  - Profile/settings (language, notifications, radius, etc.)
- Tasker dashboard:
  - View tasks within radius & skills
  - Send offers
  - Chat
  - Earnings & payouts summary (data from backend)
  - Set availability & radius & categories
- Admin panel (/admin):
  - Users
  - Tasks
  - Offers
  - Disputes (manual release/refund)
  - Payments
  - Reports
  - Analytics
  - Logs (admin actions)
