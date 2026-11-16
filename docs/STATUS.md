# Implementation status

Mirrors `src/content/status.ts`, which the app shows at `/status`.

**Foundation** means the rules and data structures exist and are tested, with no screens on top yet.

| Phase | Module | Status | Detail |
| --- | --- | --- | --- |
| 1 | App shell, routing, design system | Working | Next.js App Router, Tailwind, arcade theme. |
| 1 | Curriculum catalogue | Working | 157 procedures across 11 areas as structured data. One has content. |
| 1 | Database schema and row-level security | Foundation | Migration written and applied in an in-memory Postgres test. Not yet run on a live Supabase project. |
| 1 | Accounts | Foundation | Sign-in, sign-up and sign-out are coded. Untested end to end until Supabase keys are added. |
| 1 | Case Engine | Working | Typed case definitions with structural validation. One demo case. |
| 1 | Clinical Decision Engine | Working | Deterministic scoring, unit tested. Demo rules are unreviewed. |
| 1 | Patient Consequence Engine | Working | Odds, rolls and follow-up timeline, unit tested. Odds are gameplay values. |
| 1 | AI Supervisor Engine | Working | Four authored personalities sharing one set of facts. No AI model involved yet. |
| 1 | Clinical Review Engine | Foundation | Lifecycle rules in code and in database triggers. No admin screens. |
| 1 | Learning Analytics Engine | Working | Report, grade, XP and share text. Nothing is saved to accounts yet. |
| 1 | Commerce and Referral Engine | Foundation | Entitlement and referral rules, unit tested. No payment provider. |
| 1 | Procedure Simulation Engine | Working | Module registry plus hands-on 2D interactions: drag instruments onto the patient, tap the arch, force gauge, drag-to-rock forceps, swipe advice cards. |
| 2 | Level 1 Simple Extraction | Demo only | Hands-on game inside the app, driven by the engines. Same code builds the standalone demo. Progress is not saved to accounts yet. |
| 3 | Clinical decision, supervisors, consequences in-app | Demo only | Playable in the app with animated outcomes and an interactive Patient Returns visit. One case only. |
| 4 | Level 2 AI Specialist with source retrieval | Not built | Demo has three scripted answers only. |
| 4 | Clinical Review Admin Panel | Not built |  |
| 4 | Admin dashboard and case authoring | Not built |  |
| 5 | Payments, subscriptions, referral rewards | Not built |  |
| 5 | Saved progress, streaks, skills passport | Not built |  |
| 6 | 3D modules and more specialties | Not built |  |
| 6 | First Day as a Dentist shift mode | Not built |  |
| 7 | Browser tests, security validation, deployment | Not built | Unit tests exist. No Playwright suite yet. |
