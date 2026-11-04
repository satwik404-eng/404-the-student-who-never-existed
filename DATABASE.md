# Database and trusted operations

Production uses Supabase PostgreSQL, Auth, Edge Functions and Realtime. Local development uses SQLite with the same game engine. No service-role credential is sent to the browser.

## Storage model

`public.game_documents` is a constrained, versioned JSON document table. This deliberately keeps one rule engine across SQLite and Postgres rather than duplicating puzzle logic in SQL.

| Key | Content | Access |
| --- | --- | --- |
| `player:<uid>:<browser-id>` | Detective name, mission attempts/completion, hint counts, evidence fragments, final deadline and ending | The authenticated owner |
| `player:<uid>:room-budget` | Account-wide room creation times and retained room codes | The authenticated owner; server writes only |
| `player:<uid>:save-index` | At most ten browser investigation identifiers per account | The authenticated owner; server writes only |
| `room:<code>` | Host, members, readiness, bounded chat and shared mission status | Current members of a nonclosed room |
| `ranking:<uid>:<browser-id>` | Derived completion statistics | Owner; public only after opt-in |

`archive_private.request_budgets` stores per-account API rate windows. It is outside the exposed schema, has no client privileges, and intentionally has no browser RLS policy. Supabase's informational “RLS enabled, no policy” advisor entry for this private service-only table is expected.

## Migrations

1. `20261104200855_archive_foundation.sql`: documents, ownership/read policies, service-only commit and rate functions, authorized Presence and Postgres Changes publication.
2. `20261104202534_bounded_rooms.sql`: atomic document deletion, quota support and an hourly pg_cron job to delete expired rooms.

For a fresh project, use a current Supabase CLI, inspect `supabase --help`, link the correct project explicitly, and apply these migrations. CLI v3 defaults to local targets; explicitly confirm the intended hosted project before changing it. The connected project used during development is `funyhgrgprhlkhkujanx` in region `ap-south-1`.

Deploy the `game` Edge Function after migration. It validates every bearer token with `Auth.getUser`, rejects anonymous and non-Google/Apple identities, requires a browser identifier, and passes the verified account ID to the shared engine. Gateway `verify_jwt=false` supports current asymmetric signing keys; it does not skip the function's own authentication.

## Integrity and concurrency

The browser has SELECT only. It cannot change its score, progress, deadline, room role, or ranking through the Data API, and cannot execute privileged commit/rate RPCs.

The Edge adapter stages writes and submits all read versions to `commit_game_documents`. SQL obtains advisory locks in stable key order, compares versions, and atomically applies at most five writes. Conflicts retry up to five times. The SQLite adapter queues operations inside `BEGIN IMMEDIATE` transactions. This prevents duplicate rewards and simultaneous joins from exceeding room capacity.

## Realtime

The client subscribes to private `room:<code>` Presence and filtered Postgres updates. Policies require actual membership. Updates trigger an authorized fresh room read. Private clue text is computed by the server for the member's role and never stored in shared room documents or broadcast channels. A four-second authenticated polling fallback supports reconnection and the local backend; polling is distinct from verified WebSocket delivery.

## Backups and network access

RLS protects application rows but is not a database network firewall or backup. Check the project's network restrictions and backup plan separately before claiming these controls. Free-tier projects do not provide the same retained daily-backup control as paid plans. A backup must also be restored in a test environment before treating recovery as verified.
