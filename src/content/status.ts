/** Single source of truth for what is and is not built. Shown on /status and mirrored in docs/STATUS.md. */
export type BuildState = "working" | "demo" | "foundation" | "not-built";
export interface StatusRow {
  module: string;
  state: BuildState;
  detail: string;
  phase: number;
}
export const STATUS: StatusRow[] = [
  { module: "App shell, routing, design system", state: "working", detail: "Next.js App Router, Tailwind, arcade theme.", phase: 1 },
  { module: "Curriculum catalogue", state: "working", detail: "157 procedures across 11 areas as structured data. One has content.", phase: 1 },
  { module: "Database schema and row-level security", state: "foundation", detail: "Migration written and applied in an in-memory Postgres test. Not yet run on a live Supabase project.", phase: 1 },
  { module: "Accounts", state: "foundation", detail: "Sign-in, sign-up and sign-out are coded. Untested end to end until Supabase keys are added.", phase: 1 },
  { module: "Case Engine", state: "working", detail: "Typed case definitions with structural validation. One demo case.", phase: 1 },
  { module: "Clinical Decision Engine", state: "working", detail: "Deterministic scoring, unit tested. Demo rules are unreviewed.", phase: 1 },
  { module: "Patient Consequence Engine", state: "working", detail: "Odds, rolls and follow-up timeline, unit tested. Odds are gameplay values.", phase: 1 },
  { module: "AI Supervisor Engine", state: "working", detail: "Four authored personalities sharing one set of facts. No AI model involved yet.", phase: 1 },
  { module: "Clinical Review Engine", state: "foundation", detail: "Lifecycle rules in code and in database triggers. No admin screens.", phase: 1 },
  { module: "Learning Analytics Engine", state: "working", detail: "Report, grade, XP and share text. Nothing is saved to accounts yet.", phase: 1 },
  { module: "Commerce and Referral Engine", state: "foundation", detail: "Entitlement and referral rules, unit tested. No payment provider.", phase: 1 },
  { module: "Procedure Simulation Engine", state: "working", detail: "Module registry plus hands-on 2D interactions: drag instruments onto the patient, tap the arch, force gauge, drag-to-rock forceps, swipe advice cards.", phase: 1 },
  { module: "Level 1 Simple Extraction", state: "demo", detail: "Hands-on game inside the app, driven by the engines. Same code builds the standalone demo. Progress is not saved to accounts yet.", phase: 2 },
  { module: "Clinical decision, supervisors, consequences in-app", state: "demo", detail: "Playable in the app with animated outcomes and an interactive Patient Returns visit. One case only.", phase: 3 },
  { module: "Level 2 AI Specialist with source retrieval", state: "not-built", detail: "Demo has three scripted answers only.", phase: 4 },
  { module: "Clinical Review Admin Panel", state: "not-built", detail: "", phase: 4 },
  { module: "Admin dashboard and case authoring", state: "not-built", detail: "", phase: 4 },
  { module: "Payments, subscriptions, referral rewards", state: "not-built", detail: "", phase: 5 },
  { module: "Saved progress, streaks, skills passport", state: "not-built", detail: "", phase: 5 },
  { module: "3D modules and more specialties", state: "not-built", detail: "", phase: 6 },
  { module: "First Day as a Dentist shift mode", state: "not-built", detail: "", phase: 6 },
  { module: "Browser tests, security validation, deployment", state: "not-built", detail: "Unit tests exist. No Playwright suite yet.", phase: 7 },
];
export const STATE_LABEL: Record<BuildState, string> = { working: "Working", demo: "Demo only", foundation: "Foundation", "not-built": "Not built" };
