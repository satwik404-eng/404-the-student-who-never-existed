# Release verification — 5 November 2026

Production: https://project-404-archive.vercel.app

## Executed checks

- TypeScript strict checking and ESLint passed.
- 51 unit/component/SQLite tests passed.
- 12 Playwright browser tests passed, including the six-chapter walkthrough, both endings, two isolated co-op sessions, reconnection, mobile controls, account-wide resume, cinematic replay guards and timer preferences.
- Production build and client-bundle boundary checks passed. Paid hints, server-only solutions, late reveals and source maps are excluded from public assets.
- The ranking migration ran in an isolated PostgreSQL-compatible database with 1,100 ranking rows. Ordering before limiting, canonical legacy suppression and execution grants were verified.
- Local Git history and the source archive were checked for privileged credentials and ignored runtime files. No credential leak was found by the performed checks; this is not a guarantee against every secret pattern.

## Production evidence

- Applied `security_and_rankings` to the hosted database before deploying the game API.
- Supabase game Edge Function version 4 is active. Every API request still verifies its bearer token with Supabase Auth; disabling gateway JWT verification does not bypass that check.
- Hosted SQL confirms the ordering index exists. Anonymous and authenticated roles cannot execute the ranking helper; the service role can.
- Vercel production deployment `dpl_DNqVcCyH97NDAm3bBVfvzQ4PiHz5` is ready, including the public LinkedIn completion-credit configuration.
- The canonical HTTPS page returned 200 with CSP, HSTS and `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- A request without a token returned 401 with a generic error. An unapproved Origin received the canonical allowed origin rather than a wildcard.
- A previously authenticated live session resumed Stage 2 with 125 XP and one verified chapter, without replaying the opening.

## Limits and follow-up

- The automated two-player tests use the local adapter. Two real hosted Google accounts and Supabase Realtime delivery still need a separate production test.
- The live session-resume check does not establish a fresh Google consent/token exchange on every supported browser.
- Apple sign-in remains deferred at the owner's request.
- Retained daily backups, a restore exercise and database network restrictions are not verified. Do not claim that these are enabled on the hosted plan.
- Client-visible Supabase publishable configuration is intentional; service-role credentials and OAuth secrets must stay server-side.
- No claim of complete security is made. Continue dependency audits, authorization regression tests and monitoring after launch.
