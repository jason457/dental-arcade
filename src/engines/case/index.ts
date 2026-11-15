/**
 * Case Engine.
 * A case is structured data: patient, rules, ordered steps, the clinical decision and its
 * consequence table. New procedures are added by writing a CaseDefinition, not new app code.
 * Phase 1 ships cases from source files; Phase 4 loads published versions from the database.
 */
import type { ContentStatus, Rule } from "../types";
import type { SupervisorEvent } from "../supervisor";
import { EXT_001 } from "./cases/ext-001";

export interface ChoiceOption {
  id: string;
  text: string;
  correct?: boolean;
  /** Shown when a wrong option is picked. */
  why?: string;
  icon?: string;
  /** Multi-select only: missing this correct option raises complication odds. */
  key?: boolean;
}
interface StepBase {
  id: string;
  kicker: string;
  title: string;
  hint?: string;
}
export type Step =
  | (StepBase & { kind: "site-select"; ruleId: string; correctTooth: number; badEvent: SupervisorEvent })
  | (StepBase & { kind: "choice"; ruleId: string; options: ChoiceOption[]; badEvent: SupervisorEvent })
  | (StepBase & { kind: "pressure-hold"; ruleId: string; strikePenalty: number; badEvent: SupervisorEvent })
  | (StepBase & { kind: "alternate-hold"; ruleId: string; strikePenalty: number; movesToDecision: number; badEvent: SupervisorEvent })
  | (StepBase & { kind: "decision"; ruleId: string; prompt: string; options: DecisionOption[] })
  | (StepBase & { kind: "multi-select"; ruleId: string; options: ChoiceOption[]; perCorrect: number; perHarmful: number; goodEvent: SupervisorEvent; badEvent: SupervisorEvent });

export interface DecisionOption {
  id: string;
  text: string;
  points: number;
  event: SupervisorEvent;
  /** Chance, in game odds, that this option leads to a root fracture. Not a clinical statistic. */
  fractureOdds: number;
}
export interface CaseDefinition {
  id: string;
  slug: string;
  procedureSlug: string;
  title: string;
  level: 1 | 2;
  status: ContentStatus;
  /** True until a clinician has approved this version. Drives the DEMO banner. */
  demo: boolean;
  synthetic: true;
  patient: { label: string; age: number; sex: string };
  complaint: string;
  history: string[];
  findings: string;
  radiograph: string;
  rules: Record<string, Rule>;
  steps: Step[];
}

const REGISTRY: Record<string, CaseDefinition> = { [EXT_001.slug]: EXT_001 };

export function getCase(slug: string): CaseDefinition | undefined {
  return REGISTRY[slug];
}
export function listCases(): CaseDefinition[] {
  return Object.values(REGISTRY);
}
export function maxScore(c: CaseDefinition): number {
  return Object.values(c.rules).reduce((a, r) => a + r.max, 0);
}
/** Structural checks run in tests and, later, before a case can be submitted for review. */
export function validateCase(c: CaseDefinition): string[] {
  const problems: string[] = [];
  const used = new Set<string>();
  for (const s of c.steps) {
    if (!c.rules[s.ruleId]) problems.push(`step ${s.id} references unknown rule ${s.ruleId}`);
    used.add(s.ruleId);
    if (s.kind === "choice" && s.options.filter((o) => o.correct).length !== 1) problems.push(`step ${s.id} must have exactly one correct option`);
    if (s.kind === "choice") for (const o of s.options) if (!o.correct && !o.why) problems.push(`step ${s.id} option ${o.id} has no explanation`);
    if (s.kind === "decision") {
      const best = Math.max(...s.options.map((o) => o.points));
      if (best !== c.rules[s.ruleId]?.max) problems.push(`decision ${s.id} best option must equal rule max`);
    }
    if (s.kind === "multi-select") {
      const top = s.options.filter((o) => o.correct).length * s.perCorrect;
      if (top !== c.rules[s.ruleId]?.max) problems.push(`multi-select ${s.id} full marks must equal rule max`);
    }
  }
  for (const id of Object.keys(c.rules)) if (!used.has(id)) problems.push(`rule ${id} is never scored`);
  if (!c.synthetic) problems.push("only synthetic patients are allowed");
  return problems;
}
