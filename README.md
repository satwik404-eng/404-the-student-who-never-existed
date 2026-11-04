# 404: The Student Who Never Existed

[Play the game](https://project-404-archive.vercel.app)

A playable browser mystery created by **Satwik**. Recover Aarya Sen's erased identity through six connected chapters, then restore the student or expose the fictional university's archival AI.

The visual direction uses midnight black, electric cobalt and acid lime, with original SVG artwork. No paid image or AI service is required.

## Play locally

Use Node **24 LTS** and npm.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The development server starts a real SQLite backend on port 3001. Choose a detective name, investigate, and refresh to resume. This loopback-only development mode uses a secure random local cookie instead of external OAuth; production uses Google OAuth and Supabase.

For a local build served together with the Node backend:

```sh
VITE_BACKEND=local npm run build
npm start
```

Do not expose the development server on the public Internet. `npm run preview` previews static files only; use `npm start` for the complete local backend or configure Supabase.

## What's playable

- Six server-validated chapters: HTML source inspection, Base64 decoding, archive forensics, a simulated terminal, timeline reconstruction, and a retryable final firewall.
- Persistent evidence, scoring, first-attempt bonuses, earned hints, two endings and downloadable result cards.
- An always-accessible free field guide with vague, atmospheric direction. Optional ECHO hints never state solutions.
- Deterministic ECHO dialogue and original optional interface audio.
- Real two-player rooms, complementary private clues, readiness, chat, reconnection, shared completion, room quotas and expiry cleanup.
- Google-only production sign-in, PKCE callback, detective-name onboarding and browser-specific investigation saves. Apple support is prepared but deferred.
- Opt-in rankings built only from genuine server-verified completions; no fabricated players or scores.
- Desktop/mobile layouts, keyboard controls, focus-trapped guide, reduced motion and muted-by-default audio.
- Completion credits link to Satwik's GitHub profile and this repository. Set `VITE_LINKEDIN_URL` when the exact profile is available.

## Cloud setup

See [DATABASE.md](DATABASE.md), [DEPLOYMENT.md](DEPLOYMENT.md) and [OAUTH_SETUP.md](OAUTH_SETUP.md).

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are public browser configuration. They are not service credentials. OAuth client secrets and the Supabase service-role key never belong in Vite variables, source or Git.

Each production save is bound to the authenticated account **and** a random identifier retained in that browser. Another browser gets its own investigation. Clearing browser storage loses that browser's resume identifier. The authoritative progress remains on the server to prevent score tampering.

An account can allocate up to ten browser saves. This prevents repeated UUID changes from allocating unlimited database rows; a self-service save manager is a future improvement.

## Development checks

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium --only-shell
npm run test:e2e
npm run build
npm run test:bundle
npm audit
```

The automated browser walkthrough solves all six chapters through actual controls, checks persistence and both endings, downloads a result card, and cooperates through two isolated browser sessions. Local tests do not prove a real Google consent/token exchange or hosted Realtime delivery; those require separate deployment validation.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/` | React UI, routing, OAuth, preferences and game workspaces |
| `shared/` | Public mission metadata and safe TypeScript contracts |
| `supabase/functions/_shared/engine.ts` | Trusted rules shared by both backend adapters |
| `supabase/functions/_shared/hints.ts` | Server-only optional hint text |
| `supabase/functions/game/` | Google/Apple-authenticated Edge API and Postgres adapter |
| `supabase/migrations/` | RLS, service-only CAS transactions, quotas and cleanup |
| `server/` | Loopback-only SQLite development adapter |
| `tests/` | Rules, UI, module-boundary and browser tests |

All characters, institutions, records and security challenges are fictional. Terminal commands operate on a fixed in-memory filesystem and never execute operating-system commands.

## Credits

Created by [Satwik](https://github.com/satwik404-eng). [Project repository](https://github.com/satwik404-eng/404-the-student-who-never-existed).

The repository remains private during development. Publishing the website does not make the source public.
