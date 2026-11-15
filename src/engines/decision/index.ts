/**
 * Clinical Decision Engine.
 * Deterministic scoring only. Every number here comes from the case definition, which is
 * authored content that goes through clinical review. No LLM takes part in scoring.
 */
import type { CaseDefinition, ChoiceOption, DecisionOption } from "../case";
import type { Domain, PracticeMode, Rule, RuleResult } from "../types";

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

/** Single-answer step. Guided mode allows retries at a cost; unguided locks the first answer. */
export function scoreChoice(rule: Rule, wrongAttempts: number, mode: PracticeMode): RuleResult {
  const factor = wrongAttempts === 0 ? 1 : mode === "unguided" ? 0 : wrongAttempts === 1 ? 0.5 : 0.25;
  return { ruleId: rule.id, points: clamp(rule.max * factor, rule.max), note: wrongAttempts ? `Wrong first choice${wrongAttempts > 1 ? ` ×${wrongAttempts}` : ""}` : "First time" };
}
/** Wrong-site selection is the most serious safety error, so it costs more than a normal retry. */
export function scoreSiteSelect(rule: Rule, wrongAttempts: number, mode: PracticeMode): RuleResult {
  const pts = wrongAttempts === 0 ? rule.max : mode === "unguided" ? 0 : Math.max(2, rule.max - 4 * wrongAttempts);
  return { ruleId: rule.id, points: clamp(pts, rule.max), note: wrongAttempts ? `Wrong tooth chosen ×${wrongAttempts}` : "First time" };
}
/** Skill steps lose a fixed amount per strike (excess force, jerky movement). */
export function scoreStrikes(rule: Rule, strikes: number, penalty: number, strikeLabel: string): RuleResult {
  return { ruleId: rule.id, points: clamp(rule.max - penalty * strikes, rule.max), note: strikes ? `${strikeLabel} ×${strikes}` : `No ${strikeLabel.toLowerCase()}` };
}
export interface MultiSelectOutcome extends RuleResult {
  given: number;
  harmful: number;
  missedKeys: string[];
}
export function scoreMultiSelect(rule: Rule, options: ChoiceOption[], selected: string[], perCorrect: number, perHarmful: number): MultiSelectOutcome {
  const sel = new Set(selected);
  let given = 0, harmful = 0;
  const missedKeys: string[] = [];
  for (const o of options) {
    if (sel.has(o.id)) {
      if (o.correct) given++;
      else harmful++;
    }
    else if (o.key) missedKeys.push(o.id);
  }
  const totalCorrect = options.filter((o) => o.correct).length;
  return { ruleId: rule.id, points: clamp(given * perCorrect - harmful * perHarmful, rule.max), note: `${given} of ${totalCorrect} given${harmful ? `, ${harmful} harmful` : ""}`, given, harmful, missedKeys };
}
export function scoreDecision(rule: Rule, option: DecisionOption): RuleResult {
  return { ruleId: rule.id, points: clamp(option.points, rule.max), note: option.text };
}

export function totalScore(results: RuleResult[]): number {
  return results.reduce((a, r) => a + r.points, 0);
}
export function byDomain(c: CaseDefinition, results: RuleResult[]): Record<Domain, { points: number; max: number }> {
  const out = {} as Record<Domain, { points: number; max: number }>;
  const got = new Map(results.map((r) => [r.ruleId, r.points]));
  for (const r of Object.values(c.rules)) {
    const d = (out[r.domain] ??= { points: 0, max: 0 });
    d.points += got.get(r.id) ?? 0;
    d.max += r.max;
  }
  return out;
}
/** Safety-critical rules that were not scored in full. These lead the learning report. */
export function safetyFlags(c: CaseDefinition, results: RuleResult[]): Rule[] {
  const got = new Map(results.map((r) => [r.ruleId, r.points]));
  return Object.values(c.rules).filter((r) => r.safetyCritical && (got.get(r.id) ?? 0) < r.max);
}
