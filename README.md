# Dental Arcade

**Practice like a student. Think like a specialist.**

An interactive dental clinical simulation platform: procedure games, clinical decisions with
patient consequences, four supervisor personalities and a full specialty curriculum.

> **All clinical content in this repository is DEMO content. It was drafted by an AI assistant
> and has not been reviewed or approved by a clinician.** Patients are synthetic. Supervisors
> and specialists are fictional characters. Nothing here is clinical guidance.

## Status

Phase 1 of 7 is complete. See [docs/STATUS.md](docs/STATUS.md) for every module, or `/status` in the app.

| Works now | Not built yet |
| --- | --- |
| App shell, curriculum map (157 procedures, 11 areas) | In-app engine-driven player (Phase 2–3) |
| Eight engine modules with unit tests | AI Specialist with source retrieval (Phase 4) |
| Database schema with row-level security | Review and admin screens (Phase 4) |
| Sign-in and sign-up code (needs Supabase keys) | Payments, referral rewards, saved progress (Phase 5) |
| Standalone playable Simple Extraction demo | 3D modules, more specialties (Phase 6) |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 40 unit and database tests
npm run typecheck
npm run build
```

The app runs with no environment variables. Accounts switch on when Supabase is configured.

## Switch on accounts (Supabase)

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
   With the Supabase CLI: `supabase link`, then `supabase db push` and `psql "$DB_URL" -f supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
4. To make yourself an admin, run once in the SQL editor:
   `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`

## Deploy (Vercel)

1. Import this repository at vercel.com. The defaults for Next.js are correct.
2. Add the variables from `.env.example` under Project → Settings → Environment Variables.
3. Deploy. Every push to `main` redeploys.

## Layout

```
src/engines/        Pure TypeScript, no framework imports. One folder per engine.
  case/             Case definitions and validation. cases/ext-001.ts is the demo case.
  decision/         Deterministic scoring. No LLM takes part in scoring.
  consequence/      Possible outcomes, odds, follow-up timeline, Patient Returns.
  supervisor/       Four personalities, one set of facts.
  simulation/       Registry of reusable interaction modules (2D and 3D).
  review/           Draft → In review → Approved → Published → Superseded rules.
  analytics/        Learning report, grade, XP, share text.
  commerce/         Entitlements, free picks, referral rules.
src/content/        Curriculum catalogue and build status.
src/app/            Next.js App Router pages.
src/lib/supabase/   Server client and session helpers.
supabase/           Migration and generated seed.
public/demo/        Standalone playable demo (single HTML file).
tests/              Vitest: engines, catalogue, and the migration on in-memory Postgres.
docs/               Status and technical decisions.
```

## Adding a procedure

1. Write a `CaseDefinition` in `src/engines/case/cases/` and register it in `case/index.ts`.
2. Point the catalogue entry at it in `src/content/catalogue.ts` with status `demo`.
3. Run `npm run seed:gen` and `npm test`. `validateCase` must return no problems.
4. It stays `demo` until a verified clinical reviewer approves it. The database refuses to
   publish without that approval.
