# TaskUp – Monorepo Overview

This repository contains **three main projects** that work together:

- web/ → The public website for **https://taskup.no** (Next.js on Vercel)
- app/ → The mobile app for **iOS (App Store)** and **Android (Google Play)** built with React Native + Expo
- backend/ → The backend: **Supabase** (database, auth, realtime, storage) and **FastAPI** on Railway (business logic, Stripe webhooks, admin APIs, automation)

> IMPORTANT: This is a **production-ready platform**, not a prototype.  
> Everything must match this TaskUp master spec (features, flows, security, multi-language, escrow, disputes, etc.).

## Folder responsibilities

### web/
- Next.js + TypeScript app for https://taskup.no.
- Public marketing site, SEO, auth, dashboards for clients & taskers, task posting, live offers, web chat, wallet view, and **Admin Panel**.
- Deployed to **Vercel**, domain **taskup.no** via GoDaddy.

### app/
- React Native + Expo project (single codebase) for iOS & Android.
- Implements same core flows as web:
  - onboarding
  - authentication
  - home
  - Custom Task creation (main focus)
  - live offers
  - chat
  - wallet
  - profile & settings.

### backend/
- Backend for entire platform:
  - backend/supabase/ → DB schema, SQL migrations, RLS policies, functions.
  - backend/fastapi/ → FastAPI on Railway:
    - Stripe webhooks & escrow logic
    - Admin APIs
    - Notifications (push, email, SMS)
    - Fraud detection & rate limiting
    - Scheduled jobs, backups, etc.

## Environment variables (high level)

- web/.env.local → web env (public-ish keys)
- app/.env → mobile env (public-ish keys)
- backend/fastapi/.env → server-side secrets

## Quickstart (local)
- Backend API: `uvicorn backend.fastapi_main:app --reload` (from repo root; depends on env vars)
- Web: `cd web && npm install && npm run dev` (NEXT_PUBLIC_API_BASE_URL must point to the API)
- Mobile: `cd app && npm install && npx expo start`

Real secrets (Stripe, Supabase, Railway, email, SMS, etc.) **must never be committed** to Git. They live only in local .env files and hosting dashboards.

When working:
- Web → TaskUp/web and web/README.md
- App → TaskUp/app and app/README.md
- Backend → TaskUp/backend and its READMEs
