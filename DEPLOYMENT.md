# Deployment

The frontend is a Vite static application on Vercel. The production API runs on Supabase Edge Functions; no persistent WebSocket or Node SQLite server is deployed to Vercel.

## Required configuration

Set these Vercel Config variables for production and preview:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GITHUB_REPO
VITE_LINKEDIN_URL (optional)
```

VITE-prefixed values are intentionally public after compilation. They must never contain Google/Apple client secrets, private keys, service-role credentials, database passwords, or Vercel tokens. Supabase supplies its service-role key directly to its server runtime. Enter provider secrets only in Supabase's provider dashboard.

Vercel uses `npm ci`, `npm run build`, and `dist`. `vercel.json` provides SPA routing and security headers. The selected deployment workspace is `byg8` and project `project-404-archive`. Always inspect the linked project before a release. Do not silently use a different workspace if authentication fails.

## OAuth

Configure the exact Supabase callback in Google, and the final website origin plus `/auth/callback` in Supabase's redirect allowlist. See [OAUTH_SETUP.md](OAUTH_SETUP.md). Anonymous and email/password providers must be disabled. Google is the launch provider; Apple is deferred.

The browser uses PKCE, removes the one-time callback code from the address bar, and exchanges it with Supabase before loading private data. User-facing errors are generic. A nickname is required on first entry.

## Release checks

- Type check, lint, unit/component tests, full browser walkthrough and production build.
- Run `npm audit` against the committed npm lockfile.
- Run `npm run test:bundle`; ensure paid hints/server solutions and source maps are absent from public assets.
- Confirm the deployed Edge Function and database migrations match the source.
- Verify OAuth token exchange and cross-browser account refresh/resume on the deployed origin.
- Verify two actual authenticated accounts, room privacy and Supabase Realtime delivery.
- Verify HTTPS, redirects, CSP, framing restrictions and safe error responses on the live hostname.
- Review database network restrictions, retained daily backups and restore testing separately.
- Scan all Git history for privileged credentials; never commit `.env*` except `.env.example`.

Repository visibility is managed independently from website deployment. Never publish source or expand access without the owner's authorization.

## Security follow-up release

After owner approval, apply `20261105094913_security_and_rankings.sql` before deploying the new Edge Function and frontend. It adds service-only ordered leaderboard reads, an ordering index, and atomic unpublication of legacy ranking rows when the canonical account ranking is written. Historical records are retained. Set optional `ALLOWED_ORIGIN` only to an exact HTTPS preview origin. The static frontend adds explicit HSTS and COOP headers.

The migration, Edge Function version 4 and cinematic frontend were released on 5 November 2026. See [RELEASE_VERIFICATION.md](RELEASE_VERIFICATION.md) for evidence and outstanding hosted checks.
