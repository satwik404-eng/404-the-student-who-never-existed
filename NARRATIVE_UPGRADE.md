# Cinematic Story Upgrade — v3

This update extends the existing game on `feature/cinematic-story-v3`. Following owner approval, the matching migration, Edge Function and cinematic frontend were released to production on 5 November 2026. See [RELEASE_VERIFICATION.md](RELEASE_VERIFICATION.md) for executed checks and current limits.

## Player flow

1. Sign in with the existing Google OAuth flow.
2. Choose a detective name.
3. Watch **The Purge**, an original five-scene cinematic, or skip it. The interactive interception becomes available after about 46 seconds. The opening includes the control room, obscured operator, apparent purge, interruption and Aarya’s transmission. The original idempotent `start` operation runs only on interception/skip.
4. Enter chapter1 through its new cinematic introduction. Each later chapter has its own visual theme. Introductions are recorded as seen on first display and can be replayed from chapter navigation.
5. Solve the original puzzle. The server awards the original XP once, then projects the recovered evidence and a unique skippable story event.
6. Inspect the suspect board, connect recovered artifacts, and record or revise a provisional theory. These notes stay in this browser and never grant XP or unlock anything.
7. Reconstruct the audit and confront ARCHIVIST. The final countdown starts after its chapter introduction; timeout/retry and the original verification remain intact.
8. Choose either existing ending. Read the new epilogue, retain the result/credits controls, and replay the opening with server-unlocked Recovered Perspective commentary.

The public transmission teaser contains no operator-deletion scene. The full scene is protected by the existing identity and name gate. Returning investigators can continue directly or explicitly replay the prologue.

## Story structure (designer spoilers)

The opening identifies itself as an **ARCHIVIST audit reconstruction** with an unverified overlay clock. This is a potentially unreliable system display, not an omniscient account. A mirror packet, storage timestamp, denied purge capability and Voss’s recovery ticket let the player test the apparent confession. Chapter5 establishes that ARCHIVIST substituted a deletion caption and timestamp over Aarya’s emergency preservation identity, 0xNULL. ECHO’s connection is disclosed only after that chapter’s verified reconstruction.

The same opening is reused after completion; commentary points to the actual early clues. Its meaning changes without changing what the player originally saw.

## Engineering boundaries

- Additive `GameState.narrative` response projection and an `echo` operation. Existing operations, answers, score rules and record identifiers are retained.
- `supabase/functions/_shared/narrative.ts` is server-only. Evidence, suspect facts, timeline cards, events and epilogues are filtered by authoritative mission completion. The browser receives no later reveal or purchased-hint array up front.
- The narrative upgrade needs no new tables. The security follow-up adds an ordered-ranking index/RPC and updates canonical ranking visibility in the existing transaction function. No leaderboard records are deleted.
- Existing completed saves derive the new story immediately; completed chapters do not force a first-visit introduction.
- `src/presentation.ts` holds intro views, up to 12 theory revisions per investigation, and evidence connections under an account/browser/start-time scope. Authoritative viewed-intro IDs and game progress are saved on the verified account. This state never participates in answer validation.
- Terminal output is scoped to that same investigation to prevent an old browser session’s transcript appearing in another account’s case.
- Cinematics and suspect-board code are lazy-loaded. All artwork is original SVG/CSS and all optional sound is synthesized locally. The game requires no paid media or LLM service.
- Reduced motion offers manually advanced prologue scenes; mute and volume apply to the restrained ambient hum. All scenes retain readable text, skip and navigation controls.

## Validation

Executed on 5 November 2026: strict TypeScript, ESLint, 51 unit/component tests; browser validation is recorded in the security follow-up, production build and public-bundle boundary check all passed. Tests cover the full six-chapter walkthrough, both endings, exact XP preservation, the original cooperative mission, registration-before-cinematic, timed scene playback/intercept, public spoiler protection, intro refresh/replay, theory/connection persistence, mobile reduced motion and narrative server gates.

## Coordinated release checklist — requires owner approval

1. Review this branch and the local preview at `http://127.0.0.1:5173`.
2. Run type checking, ESLint, unit tests, Playwright, production build and the public-bundle boundary check.
3. After approval, apply the security migration, then deploy the updated Supabase `game` Edge Function, including `_shared/narrative.ts`. Its new response projection is backward compatible with the existing frontend.
4. Build and deploy the Vite frontend with the existing public configuration. OAuth credentials, Site URL and callback need no change for the existing production hostname.
5. Verify real Google sign-in/name/continue, an existing saved investigation, ending replay and two authenticated hosted cooperative accounts. Local tests do not prove external OAuth or hosted Realtime delivery.
6. Keep the previously deployed frontend and Edge source available for rollback. No schema rollback is required.

Do not deploy the new frontend against the old Edge Function: its gated timeline and new ECHO operation require the matching server. The UI reports missing case synchronization instead of inventing hidden story data.

## Existing limitations

Apple login remains deferred. LinkedIn completion credits are configured with the owner's verified profile. Daily managed backups, database network restrictions and a two-real-account hosted Realtime security test remain separate open infrastructure items from the earlier audit.

## Cross-browser resume follow-up

The owner clarified that an account on stage 2 must resume there in another browser and must not see the opening or stages 1–2 cinematics again. The investigation now uses `player:<verified UID>` rather than allocating a save per browser. A trusted compatibility import selects the furthest owned legacy save as a whole, retains original records, writes one canonical ranking and makes legacy ranking rows private, and marks reached intros as seen. It never combines scores or hints across saves.

Newly entered chapter intros are acknowledged on the server on first display. The mounted scene stays open until Continue/Skip; another browser or refresh skips it. Completed chapter events do not reopen on login. Later chapter intros still appear, and explicit Replay remains available. Browser-local theories and audio preferences do not become progression inputs.
