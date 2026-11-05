# Security

This game teaches observation and encoding with fictional records. It must never execute real shell commands, attack real systems or accept browser-supplied scores.

## Trust boundaries

- The browser and every request field are untrusted.
- Production identity is verified by Supabase `Auth.getUser` on each game request. Only Google/Apple OAuth identities are eligible; Google is the launch provider.
- Player ownership derives from the verified account, never user-editable metadata or a request-supplied UID.
- The verified UID selects the account-wide save. Browser identifiers are presentation metadata and grant no progression or cross-account authority. Legacy import filters both owner UID and valid player keys, and preserves one whole server-owned save.
- Database writes, score calculation, hints, deadlines, room membership and private clue selection belong to the server.
- Direct client writes and privileged RPC execution are revoked. RLS controls reads and private Presence.
- Supabase's publishable key is public configuration, not a service credential. OAuth secrets and service-role keys are server-only.

## Input and resource controls

Inputs are type/length validated and rendered as React text. The terminal is a fixed interpreter over fictional strings. API calls have a database-backed 240/account/minute budget. Room creation is limited to three/account/hour and three retained rooms; closed rooms are reclaimed and expired rooms are deleted hourly. Chat is capped at 60 messages of 280 characters.

## Local adapter

The SQLite server is a development-only loopback service. Its random session cookie is HttpOnly and SameSite Strict, and only a SHA-256 token digest is stored. It deliberately does not collect passwords. Do not deploy it as an Internet-facing authentication service.

## Review and disclosure

Do not print credentials in reports or logs. Check actual authentication, RLS, room privacy, shared hint content, score manipulation, request budgets, dependency advisories, deployed headers and Git history. Keep backups and database network controls separate from RLS claims. No review guarantees the absence of all vulnerabilities.

Report a potential issue privately to the repository owner through GitHub. Avoid posting live credentials or other players' data in public issues.
