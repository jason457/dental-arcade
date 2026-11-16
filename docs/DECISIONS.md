# Technical decisions

Decisions made without asking, as the brief requested. Each can be revisited.

1. **Engines are pure TypeScript.** No React, Next.js or Supabase imports inside `src/engines`.
   They run in tests, on the server and in the browser, and can be reused by a future mobile app.
2. **Scoring is deterministic and data-driven.** Points, penalties and odds live in the case
   definition. No language model can invent or alter a score.
3. **Supervisor lines are authored, not generated.** All four personalities pair their line with the
   same rule fact, so tone cannot change clinical content. A model may be added later for free
   conversation, constrained to reviewed material.
4. **Decision quality is scored separately from outcome.** An unsafe choice scores zero even when
   the patient is lucky. Complications are possible, never guaranteed.
5. **Odds are gameplay values.** They are labelled as such everywhere and must be reviewed with the case.
6. **Review rules are enforced twice:** in `engines/review` for the interface, and in database
   triggers so they hold even if application code is wrong. Approved content is immutable.
7. **The browser never writes scores, XP, purchases or referral rewards.** Row-level security gives
   learners read access to their own records only. The server writes them with the service role.
8. **The catalogue lives in TypeScript and generates the database seed**, so they cannot drift.
9. **Catalogue status is separate from review status.** `planned` / `demo` / `published` is what
   learners see; the six-stage lifecycle belongs to content versions.
10. **Next.js 16 with Cache Components.** Pages are static shells; anything that reads the session
    streams in behind Suspense. Session refresh runs in `src/proxy.ts` (formerly middleware).
11. **Fonts are bundled** (`@fontsource`) so builds do not depend on a font CDN.
12. **The extraction game is plain TypeScript and SVG** (`src/game`), mounted by a small React
    wrapper. The same code bundles into the standalone demo with esbuild, so there is one source.
    Every step is a hands-on action (drag, tap, hold, swipe) rather than a list of answers.
    Phaser 3 and React Three Fiber are deferred until a module needs physics or 3D.
13. **Currency defaults to MYR** in the pricing table. Prices are rows, editable by admins.
14. **Migration is tested on PGlite**, an in-memory Postgres, with a stub of Supabase's `auth`
    schema. That checks SQL validity and triggers. It does not test row-level security policies.

## Known gaps

- Row-level security policies are written and enabled but not yet tested against a live Supabase project.
- Sign-in and sign-up have not been run end to end.
- No Playwright suite yet; pages were smoke-checked once in a headless browser.
- The game's scenes are hand-built for this one case. A second procedure will show which parts
  to generalise into reusable scene modules.
- Touch gestures were tested with a mouse in a headless browser, not yet on a real phone.
- Music and sound are synthesised live (Web Audio). Checked that notes are produced; not yet listened to on a phone speaker.
