/**
 * Clinical Review Engine.
 * Content lifecycle: draft → in_review → approved → published → superseded (or withdrawn).
 * Only a verified human clinical reviewer, who is not the author, can approve.
 * The same rules are enforced again in the database (see supabase/migrations).
 */
import type { ContentStatus } from "../types";

export type ActorKind = "human" | "ai";
export type Role = "learner" | "author" | "clinical_reviewer" | "admin";
export interface Actor {
  id: string;
  kind: ActorKind;
  role: Role;
  /** Reviewer qualifications checked by an admin. */
  verified?: boolean;
}
export interface ContentVersion {
  id: string;
  status: ContentStatus;
  authorId: string;
  aiGenerated: boolean;
  approval?: { reviewerId: string; reviewedAt: Date; expiresAt: Date; safetyCriticalValidated: boolean };
}
const NEXT: Record<ContentStatus, ContentStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["superseded", "withdrawn"],
  superseded: [],
  withdrawn: [],
};
export interface TransitionCheck {
  ok: boolean;
  reason?: string;
}
export function canTransition(v: ContentVersion, to: ContentStatus, actor: Actor, now = new Date()): TransitionCheck {
  if (!NEXT[v.status].includes(to)) return { ok: false, reason: `Cannot move from ${v.status} to ${to}.` };
  if (actor.kind === "ai") return { ok: false, reason: "AI cannot change the review status of clinical content." };
  if (to === "in_review" || (to === "draft" && v.status !== "in_review")) {
    return actor.role === "author" || actor.role === "admin" ? { ok: true } : { ok: false, reason: "Only authors and admins can submit or pull back content." };
  }
  if (to === "approved" || (to === "draft" && v.status === "in_review")) {
    if (actor.role !== "clinical_reviewer" || !actor.verified) return { ok: false, reason: "Only a verified clinical reviewer can decide a review." };
    if (actor.id === v.authorId) return { ok: false, reason: "Reviewers cannot approve their own content." };
    return { ok: true };
  }
  if (to === "published") {
    if (actor.role !== "admin") return { ok: false, reason: "Only admins publish." };
    if (!v.approval) return { ok: false, reason: "No approval on record." };
    if (!v.approval.safetyCriticalValidated) return { ok: false, reason: "Safety-critical decisions have not been validated." };
    if (v.approval.expiresAt <= now) return { ok: false, reason: "The approval has expired. Re-review is needed." };
    return { ok: true };
  }
  return actor.role === "admin" ? { ok: true } : { ok: false, reason: "Only admins can supersede or withdraw." };
}
/** Content may be presented as authoritative only while published under an unexpired approval. */
export function isAuthoritative(v: ContentVersion, now = new Date()): boolean {
  return v.status === "published" && !!v.approval && v.approval.expiresAt > now;
}
/** Any edit to an approved or published version must create a new draft version. */
export function editRequiresNewVersion(v: ContentVersion): boolean {
  return v.status !== "draft";
}
