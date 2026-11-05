# Database and trusted operations

Production uses Supabase PostgreSQL, Auth, Edge Functions and Realtime. Local development uses SQLite with the same game engine. No service-role credential is sent to the browser.

## Storage model

`public.game_documents` is a constrained, versioned JSON document table. This deliberately keeps one rule engine across SQLite and Postgres rather than duplicating puzzle logic in SQL.

| Key | Content | Access |
| --- | --- | --- |
| `player:<uid>` | Account-wide detective name, attempts/completion, hints, evidence, deadline, ending and viewed cinematic IDs | The authenticated owner |
| `player:<uid>:room-budget` | Account-wide room creation times and retained room codes | The authenticated owner; server writes only |
| `player:<uid>:<browser-id>` | Retained legacy browser saves, imported once into the account-wide save | The authenticated owner; server writes only |
| `room:<code>` | Host, members, readiness, bounded chat and shared mission status | Current members of a nonclosed room |
| `ranking:<uid>` or a retained legacy ranking key | Derived completion statistics | Owner; public only after opt-in |

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

## Account-wide resume compatibility

Version2 of the saved-player document is keyed only by the verified UID. On first use, the trusted adapter lists at most 32 owned player documents, filters valid legacy keys, and selects the furthest completed investigation (latest activity breaks ties). It copies that whole save without combining bonuses, hints or completion clocks. Existing documents and ranking records are retained. CAS captures source versions so concurrent imports do not overwrite a newer canonical save. No schema migration is needed.

Viewed intro IDs are saved through the authenticated `cinematic-seen` operation only for unlocked chapters. Imported saves mark the currently reached chapter and all earlier intros as seen. An existing start time suppresses the prologue on later sign-in. Explicit Replay never submits puzzle answers or grants rewards.

## Canonical rankings and ordered reads

The security follow-up migration writes new completions only to `ranking:<uid>`. Inside the same trusted commit transaction, legacy `ranking:<uid>:*` rows owned by that account become private; their completion data is retained. An incomplete account has a private suppression marker, so opting out cannot reveal a stale legacy row. Ordered reads deduplicate accounts and sort in SQL before limiting to 50. The read RPC is executable only by service_role.
