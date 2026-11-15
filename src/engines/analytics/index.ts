/**
 * Learning Analytics Engine.
 * Builds the learning report from rule results. Shareable output never contains patient details.
 */
import type { CaseDefinition } from "../case";
import { byDomain, safetyFlags, totalScore } from "../decision";
import type { RunOutcome } from "../consequence";
import { PERSONAS } from "../supervisor";
import type { Domain, PracticeMode, Rule, RuleResult, SupervisorId } from "../types";

export type Grade = "S" | "A" | "B" | "C";
export const RETURN_VISIT_BONUS_XP = 150;

export function gradeFor(score: number): Grade {
  return score >= 90 ? "S" : score >= 75 ? "A" : score >= 55 ? "B" : "C";
}
export interface LearningReport {
  caseId: string;
  score: number;
  maxScore: number;
  grade: Grade;
  xp: number;
  domains: Record<Domain, { points: number; max: number }>;
  safetyFlags: Rule[];
  rows: { rule: Rule; points: number; note: string }[];
  shareText: string;
  disclaimer: string;
}
export interface ReportContext {
  supervisor: SupervisorId;
  mode: PracticeMode;
  outcome?: RunOutcome;
  returnVisitManagedFirstTime?: boolean;
}
export function buildReport(c: CaseDefinition, results: RuleResult[], ctx: ReportContext): LearningReport {
  const score = totalScore(results);
  const max = Object.values(c.rules).reduce((a, r) => a + r.max, 0);
  const grade = gradeFor((score / max) * 100);
  const xp = score * 10 + (ctx.returnVisitManagedFirstTime ? RETURN_VISIT_BONUS_XP : 0);
  const got = new Map(results.map((r) => [r.ruleId, r]));
  const shareText = [
    `Dental Arcade · ${c.title.split(",")[0]}${c.demo ? " demo" : ""}`,
    `Grade ${grade} · ${score}/${max} · ${xp} XP`,
    `Supervisor: ${PERSONAS[ctx.supervisor].tag} · ${ctx.mode === "guided" ? "Guided" : "Unguided"}`,
    c.demo ? "Demo content, not clinically approved." : "",
  ].filter(Boolean).join("\n");
  return {
    caseId: c.id, score, maxScore: max, grade, xp,
    domains: byDomain(c, results),
    safetyFlags: safetyFlags(c, results),
    rows: Object.values(c.rules).map((rule) => ({ rule, points: got.get(rule.id)?.points ?? 0, note: got.get(rule.id)?.note ?? "Not reached" })),
    shareText,
    disclaimer: "This score reflects choices in a simulation. It does not assess real surgical skill.",
  };
}
/** XP needed to reach a level. Level 1 starts at 0. */
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 500)) + 1;
}
