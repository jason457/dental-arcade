/**
 * Commerce and Referral Engine.
 * Pure entitlement and referral rules. The server calls these with data it has verified itself;
 * nothing here trusts the browser. Payment provider integration arrives in Phase 5.
 */
import type { CatalogueStatus } from "../types";

export const FREE_LEVEL1_PICKS = 3;
export type Plan = "free" | "paid" | "institution";

export interface AccessRequest {
  plan: Plan;
  level: 1 | 2;
  procedureSlug: string;
  procedureStatus: CatalogueStatus;
  freePicks: string[];
  purchasedModules: string[];
  creditUnlocks: string[];
}
export interface AccessDecision {
  allowed: boolean;
  reason: "ok" | "not-available" | "needs-free-pick" | "free-picks-used" | "needs-purchase";
}
export function canAccess(r: AccessRequest): AccessDecision {
  if (r.procedureStatus === "planned") return { allowed: false, reason: "not-available" };
  if (r.level === 1) {
    if (r.plan !== "free" || r.freePicks.includes(r.procedureSlug)) return { allowed: true, reason: "ok" };
    return { allowed: false, reason: r.freePicks.length < FREE_LEVEL1_PICKS ? "needs-free-pick" : "free-picks-used" };
  }
  // Level 2 specialist modules are only ever unlocked for clinician-approved, published content.
  if (r.procedureStatus !== "published") return { allowed: false, reason: "not-available" };
  const owned = r.plan === "institution" || r.purchasedModules.includes(r.procedureSlug) || r.creditUnlocks.includes(r.procedureSlug);
  return owned ? { allowed: true, reason: "ok" } : { allowed: false, reason: "needs-purchase" };
}

export interface ReferralFacts {
  inviterId: string;
  referredId: string;
  /** Verified server-side: the referred user finished a qualifying practice. */
  referredCompletedQualifyingPractice: boolean;
  alreadyRewarded: boolean;
  /** True when the referred account already had an inviter recorded. */
  referredHasOtherInviter: boolean;
}
export type ReferralResult =
  | { reward: true; inviterCredits: 1; referredBonusPractice: 1 }
  | { reward: false; reason: "self-referral" | "duplicate" | "not-qualified" | "already-referred" };
export function evaluateReferral(f: ReferralFacts): ReferralResult {
  if (f.inviterId === f.referredId) return { reward: false, reason: "self-referral" };
  if (f.referredHasOtherInviter) return { reward: false, reason: "already-referred" };
  if (f.alreadyRewarded) return { reward: false, reason: "duplicate" };
  if (!f.referredCompletedQualifyingPractice) return { reward: false, reason: "not-qualified" };
  return { reward: true, inviterCredits: 1, referredBonusPractice: 1 };
}
/** A referral credit can only be spent on published, clinician-approved content. */
export function canRedeemCredit(procedureStatus: CatalogueStatus, alreadyRedeemed: boolean): boolean {
  return procedureStatus === "published" && !alreadyRedeemed;
}
