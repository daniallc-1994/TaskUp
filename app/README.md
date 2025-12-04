# TaskUp App – React Native + Expo (iOS & Android)

This is the **mobile app** project. One codebase for:
- iOS (App Store)
- Android (Google Play)

Same business logic as web, with native UX.

## Tech stack

- React Native + Expo
- TypeScript
- React Navigation
- React Query / TanStack Query
- Supabase JS client
- Stripe React Native SDK
- Expo Notifications
- react-i18next (or similar) for i18n

## Folder structure (example)

app/
├── README.md
├── app.config.(ts|js) / app.json
├── package.json
├── tsconfig.json
├── assets/
│   ├── icons/
│   ├── splash/
│   └── images/
├── src/
│   ├── screens/ ← Onboarding, Auth, Home, Task, Offers, Chat, Wallet, Profile
│   ├── navigation/ ← stack/tab navigators
│   ├── components/ ← reusable UI
│   ├── features/ ← tasks, offers, chat, wallet, profile
│   ├── lib/ ← supabase client, API client, stripe, notifications
│   ├── hooks/ ← custom hooks
│   ├── i18n/ ← translations & config
│   └── theme/ ← dark neon glass tokens
└── .env ← NOT committed

## Env vars (app/.env)

EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL  
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY  
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY  
EXPO_PUBLIC_API_BASE_URL=https://YOUR-RAILWAY-API-BASE-URL  
EXPO_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN  

## App responsibilities

- Onboarding (Scandinavian dark + neon slides).
- Auth: login, signup (client/tasker), forgot password, email verification handling.
- Client:
  - Home: “Get Offers Now” → Custom Task
  - Categories
  - Create task
  - Live offers feed (realtime)
  - Accept offer → backend escrow
  - Chat
  - Wallet view
  - Profile settings (language, notifications, radius, etc.)
- Tasker:
  - Receive notifications for new tasks within radius (~100 km)
  - View task list
  - Send offers
  - Chat
  - Earnings & payouts view
  - Availability calendar & preferences
- Push notifications:
  - new tasks, offers, messages, status updates

No DB/payments logic implemented here. The app only calls backend APIs.

## Current status

- Scaffold pending: minimal Expo TypeScript shell will be added to mirror TaskUp flows (auth, tasks, offers, chat, wallet, profile) and call the shared FastAPI/Supabase backend.
