# Setup

1. `npm i`
2. Run `supabase.sql` in Supabase SQL editor.
   **Already deployed before?** Re-run it. It now also creates `login_attempts`,
   which the admin brute-force lockout needs. Until that table exists `/api/login`
   returns 503 — it refuses to log you in rather than run with the lockout
   silently disabled. The `create table` uses `if not exists`, so re-running is
   safe and won't touch existing links.
3. Copy `.env.example` → `.env.local`, fill values (Supabase URL/service key, `ADMIN_PASSWORD`, random `TOKEN_SECRET` — e.g. `openssl rand -hex 32`, Turnstile keys, `NEXT_PUBLIC_BASE_URL`).
4. `npm run dev`
5. Go to `/admin`, log in, create links.
6. Deploy to Vercel, add same env vars in project settings.

Visitor flow: `/CODE` → countdown + Turnstile → `/api/verify` → signed token → `/api/r/CODE?token=...` → 302 redirect.
