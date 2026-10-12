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

## Performance & Security Optimizations

This implementation includes several performance and security enhancements:

### Database Optimizations
- Indexes on `created_at`, `enabled`, `destination_url` for faster queries
- Index on `login_attempts.last_attempt` for efficient cleanup
- Automatic cleanup function for old login attempts (>30 days)

### API Optimizations
- Created short codes using `INSERT ... ON CONFLICT` to avoid race conditions
- Optimized rate limiter with per-key window tracking
- Reduced unnecessary data fetching in API routes

### Security Enhancements
- Comprehensive security headers (CSP, Permissions-Policy, etc.)
- Improved session security with partitioned cookies
- Frame-ancestors restrictions to prevent clickjacking
- Referrer policy to protect user privacy

### Accessibility Improvements
- Enhanced touch targets (minimum 44x44px)
- ARIA attributes for screen readers
- Improved color contrast and focus indicators
- Respects user preferences for reduced motion and color schemes

Visitor flow: `/CODE` → countdown + Turnstile → `/api/verify` → signed token → `/api/r/CODE?token=...` → 302 redirect.
