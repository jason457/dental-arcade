import { describe, expect, it } from "vitest";
import { getCase, maxScore, validateCase, type Step } from "@/engines/case";
import { byDomain, safetyFlags, scoreChoice, scoreDecision, scoreMultiSelect, scoreSiteSelect, scoreStrikes, totalScore } from "@/engines/decision";
import { buildTimeline, complicationOdds, rollAftermath, rollFracture } from "@/engines/consequence";
import { LINES, PERSONAS, SUPERVISOR_ORDER, closingEvent, react } from "@/engines/supervisor";
import { canTransition, editRequiresNewVersion, isAuthoritative, type Actor, type ContentVersion } from "@/engines/review";
import { buildReport, gradeFor, levelForXp } from "@/engines/analytics";
import { canAccess, canRedeemCredit, evaluateReferral } from "@/engines/commerce";
import { MODULES, moduleFor } from "@/engines/simulation";
import type { RuleResult } from "@/engines/types";

const c = getCase("simple-extraction-46")!;
const step = <K extends Step["kind"]>(id: string) => c.steps.find((s) => s.id === id) as Extract<Step, { kind: K }>;

describe("case engine", () => {
  it("demo case is structurally valid and totals 100", () => {
    expect(validateCase(c)).toEqual([]);
    expect(maxScore(c)).toBe(100);
  });
  it("demo case is labelled unreviewed and synthetic", () => {
    expect(c.demo).toBe(true);
    expect(c.status).toBe("draft");
    expect(c.synthetic).toBe(true);
  });
  it("every step kind has a simulation module", () => {
    for (const s of c.steps) expect(moduleFor(s.kind), s.kind).toBeDefined();
    expect(MODULES.some((m) => m.dimension === "3D")).toBe(true);
  });
});

describe("decision engine", () => {
  const A1 = c.rules.A1, S1 = c.rules.S1;
  it("scores single-choice steps by mode and attempts", () => {
    expect(scoreChoice(A1, 0, "guided").points).toBe(6);
    expect(scoreChoice(A1, 1, "guided").points).toBe(3);
    expect(scoreChoice(A1, 2, "guided").points).toBe(2);
    expect(scoreChoice(A1, 1, "unguided").points).toBe(0);
  });
  it("penalises wrong-site selection hard", () => {
    expect(scoreSiteSelect(S1, 0, "guided").points).toBe(10);
    expect(scoreSiteSelect(S1, 1, "guided").points).toBe(6);
    expect(scoreSiteSelect(S1, 5, "guided").points).toBe(2);
    expect(scoreSiteSelect(S1, 1, "unguided").points).toBe(0);
  });
  it("never scores below zero on strikes", () => {
    expect(scoreStrikes(c.rules.T2, 0, 3, "Excessive force").points).toBe(10);
    expect(scoreStrikes(c.rules.T2, 9, 3, "Excessive force").points).toBe(0);
  });
  it("scores the resistance decision from the case table", () => {
    const d = step<"decision">("resistance");
    const pts = Object.fromEntries(d.options.map((o) => [o.id, scoreDecision(c.rules.D1, o).points]));
    expect(pts).toEqual({ force: 0, safe: 20, twist: 0, abandon: 6 });
  });
  it("scores aftercare and reports missed key advice", () => {
    const s = step<"multi-select">("aftercare");
    const all = s.options.filter((o) => o.correct).map((o) => o.id);
    expect(scoreMultiSelect(c.rules.C2, s.options, all, s.perCorrect, s.perHarmful).points).toBe(10);
    const poor = scoreMultiSelect(c.rules.C2, s.options, ["gauze", "mouthwash", "straw"], s.perCorrect, s.perHarmful);
    expect(poor.points).toBe(0);
    expect(poor.harmful).toBe(2);
    expect(poor.missedKeys.sort()).toEqual(["no-rinse", "no-smoke"]);
  });
  it("perfect run totals 100 with no safety flags", () => {
    const results: RuleResult[] = Object.values(c.rules).map((r) => ({ ruleId: r.id, points: r.max, note: "" }));
    expect(totalScore(results)).toBe(100);
    expect(safetyFlags(c, results)).toEqual([]);
    const d = byDomain(c, results);
    expect(d.Safety.max + d.Technique.max + d.Judgement.max + d.Aftercare.max).toBe(100);
  });
  it("flags unscored safety-critical rules", () => {
    expect(safetyFlags(c, []).map((r) => r.id).sort()).toEqual(["A2", "C1", "D1", "S1", "S2"]);
  });
});

describe("consequence engine", () => {
  const d = step<"decision">("resistance");
  const opt = (id: string) => d.options.find((o) => o.id === id)!;
  it("a safe decision can never fracture", () => {
    expect(rollFracture(opt("safe"), () => 0)).toBe(false);
  });
  it("an unsafe decision makes fracture possible, not certain", () => {
    expect(rollFracture(opt("force"), () => 0.1)).toBe(true);
    expect(rollFracture(opt("force"), () => 0.9)).toBe(false);
  });
  it("risk rises with poor aftercare and is capped below certainty", () => {
    const good = complicationOdds({ missedKeyAdvice: 0, harmfulAdvice: 0, fracture: false, haemostasisConfirmed: true });
    const bad = complicationOdds({ missedKeyAdvice: 2, harmfulAdvice: 3, fracture: true, haemostasisConfirmed: false });
    expect(bad.drySocket).toBeGreaterThan(good.drySocket);
    expect(bad.drySocket).toBeLessThan(1);
    expect(good.drySocket).toBeGreaterThan(0);
    expect(bad.bleed).toBeGreaterThan(good.bleed);
  });
  it("timeline covers five stages and marks possible outcomes either way", () => {
    const hit = rollAftermath("force", true, { missedKeyAdvice: 2, harmfulAdvice: 0, haemostasisConfirmed: false }, () => 0);
    const tl = buildTimeline(hit, false);
    expect(tl.map((n) => n.when)).toEqual(["During the procedure", "Same evening", "Day 3", "Week 3", "Month 3"]);
    expect(tl[2].patientReturns).toBe(true);
    expect(tl[2].returnDecision).toBe("dry-socket");
    const miss = rollAftermath("force", false, { missedKeyAdvice: 2, harmfulAdvice: 0, haemostasisConfirmed: false }, () => 0.99);
    const tl2 = buildTimeline(miss, false);
    expect(tl2[0].possibility).toBe("did-not-happen");
    expect(tl2[2].returnDecision).toBeUndefined();
    expect(tl2[2].patientReturns).toBe(true);
  });
});

describe("supervisor engine", () => {
  it("every event has a line for every personality", () => {
    for (const [event, lines] of Object.entries(LINES)) for (const id of SUPERVISOR_ORDER) expect(lines[id], `${event}/${id}`).toBeTruthy();
    expect(Object.keys(PERSONAS).sort()).toEqual([...SUPERVISOR_ORDER].sort());
  });
  it("personalities share the same fact", () => {
    const facts = SUPERVISOR_ORDER.map((id) => react("decisionForce", id, c.rules.D1.fact).fact);
    expect(new Set(facts).size).toBe(1);
    expect(new Set(SUPERVISOR_ORDER.map((id) => react("decisionForce", id).line)).size).toBe(4);
  });
  it("picks a closing line by score", () => {
    expect([closingEvent(90), closingEvent(60), closingEvent(10)]).toEqual(["endHigh", "endMid", "endLow"]);
  });
});

describe("review engine", () => {
  const author: Actor = { id: "a", kind: "human", role: "author" };
  const reviewer: Actor = { id: "r", kind: "human", role: "clinical_reviewer", verified: true };
  const admin: Actor = { id: "x", kind: "human", role: "admin" };
  const ai: Actor = { id: "bot", kind: "ai", role: "admin" };
  const v = (status: ContentVersion["status"], extra: Partial<ContentVersion> = {}): ContentVersion => ({ id: "v1", status, authorId: "a", aiGenerated: true, ...extra });
  const approval = { reviewerId: "r", reviewedAt: new Date("2026-01-01"), expiresAt: new Date("2027-01-01"), safetyCriticalValidated: true };
  const now = new Date("2026-06-01");

  it("AI can never move content through review", () => {
    expect(canTransition(v("in_review"), "approved", ai).ok).toBe(false);
    expect(canTransition(v("draft"), "in_review", ai).ok).toBe(false);
  });
  it("only a verified reviewer who is not the author approves", () => {
    expect(canTransition(v("in_review"), "approved", reviewer).ok).toBe(true);
    expect(canTransition(v("in_review"), "approved", { ...reviewer, verified: false }).ok).toBe(false);
    expect(canTransition(v("in_review"), "approved", { ...reviewer, id: "a" }).ok).toBe(false);
    expect(canTransition(v("in_review"), "approved", admin).ok).toBe(false);
  });
  it("publishing needs a live, safety-validated approval", () => {
    expect(canTransition(v("approved"), "published", admin, now).ok).toBe(false);
    expect(canTransition(v("approved", { approval }), "published", admin, now).ok).toBe(true);
    expect(canTransition(v("approved", { approval: { ...approval, safetyCriticalValidated: false } }), "published", admin, now).ok).toBe(false);
    expect(canTransition(v("approved", { approval }), "published", admin, new Date("2028-01-01")).ok).toBe(false);
  });
  it("cannot skip stages", () => {
    expect(canTransition(v("draft"), "published", admin).ok).toBe(false);
    expect(canTransition(v("draft"), "approved", reviewer).ok).toBe(false);
    expect(canTransition(v("draft"), "in_review", author).ok).toBe(true);
  });
  it("authority expires and edits fork a new version", () => {
    expect(isAuthoritative(v("published", { approval }), now)).toBe(true);
    expect(isAuthoritative(v("published", { approval }), new Date("2028-01-01"))).toBe(false);
    expect(isAuthoritative(v("approved", { approval }), now)).toBe(false);
    expect(editRequiresNewVersion(v("published"))).toBe(true);
    expect(editRequiresNewVersion(v("draft"))).toBe(false);
  });
});

describe("analytics engine", () => {
  it("builds a report with no patient details in the share text", () => {
    const results: RuleResult[] = Object.values(c.rules).map((r) => ({ ruleId: r.id, points: r.max, note: "First time" }));
    const rep = buildReport(c, results, { supervisor: "roast", mode: "guided", returnVisitManagedFirstTime: true });
    expect(rep.grade).toBe("S");
    expect(rep.xp).toBe(1150);
    expect(rep.shareText).toContain("not clinically approved");
    expect(rep.shareText).not.toContain(c.patient.label);
    expect(rep.shareText).not.toMatch(/54|P-046|amlodipine/);
    expect(rep.rows).toHaveLength(12);
  });
  it("grades and levels", () => {
    expect([gradeFor(95), gradeFor(80), gradeFor(60), gradeFor(20)]).toEqual(["S", "A", "B", "C"]);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(2000)).toBe(3);
  });
});

describe("commerce and referral engine", () => {
  const base = { plan: "free" as const, level: 1 as const, procedureSlug: "simple-extraction", procedureStatus: "demo" as const, freePicks: [], purchasedModules: [], creditUnlocks: [] };
  it("free accounts get three Level 1 picks", () => {
    expect(canAccess(base).reason).toBe("needs-free-pick");
    expect(canAccess({ ...base, freePicks: ["simple-extraction"] }).allowed).toBe(true);
    expect(canAccess({ ...base, freePicks: ["a", "b", "c"] }).reason).toBe("free-picks-used");
    expect(canAccess({ ...base, plan: "paid" }).allowed).toBe(true);
  });
  it("planned content is never accessible and Level 2 needs published content", () => {
    expect(canAccess({ ...base, plan: "paid", procedureStatus: "planned" }).allowed).toBe(false);
    expect(canAccess({ ...base, plan: "paid", level: 2 }).reason).toBe("not-available");
    expect(canAccess({ ...base, plan: "paid", level: 2, procedureStatus: "published" }).reason).toBe("needs-purchase");
    expect(canAccess({ ...base, level: 2, procedureStatus: "published", creditUnlocks: ["simple-extraction"] }).allowed).toBe(true);
  });
  it("blocks self-referral, duplicates and unqualified referrals", () => {
    const f = { inviterId: "a", referredId: "b", referredCompletedQualifyingPractice: true, alreadyRewarded: false, referredHasOtherInviter: false };
    expect(evaluateReferral(f)).toEqual({ reward: true, inviterCredits: 1, referredBonusPractice: 1 });
    expect(evaluateReferral({ ...f, referredId: "a" })).toEqual({ reward: false, reason: "self-referral" });
    expect(evaluateReferral({ ...f, alreadyRewarded: true })).toEqual({ reward: false, reason: "duplicate" });
    expect(evaluateReferral({ ...f, referredCompletedQualifyingPractice: false })).toEqual({ reward: false, reason: "not-qualified" });
    expect(evaluateReferral({ ...f, referredHasOtherInviter: true })).toEqual({ reward: false, reason: "already-referred" });
  });
  it("credits only unlock published content", () => {
    expect(canRedeemCredit("demo", false)).toBe(false);
    expect(canRedeemCredit("published", false)).toBe(true);
    expect(canRedeemCredit("published", true)).toBe(false);
  });
});
