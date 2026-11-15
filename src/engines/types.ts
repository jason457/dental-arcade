/** Shared types for all Dental Arcade engines. Engines are pure TypeScript with no framework imports. */
export type SupervisorId = "mentor" | "strict" | "roast" | "osce";
export type PracticeMode = "guided" | "unguided";
export type Domain = "Safety" | "Technique" | "Judgement" | "Aftercare";
export type ContentStatus = "draft" | "in_review" | "approved" | "published" | "superseded" | "withdrawn";
/** Status shown to learners. Anything that is not clinician-approved and published is "demo" or "planned". */
export type CatalogueStatus = "planned" | "demo" | "published";

export interface Rule {
  id: string;
  label: string;
  max: number;
  domain: Domain;
  safetyCritical: boolean;
  /** The clinical fact every supervisor personality shares for this rule. */
  fact: string;
}
export interface RuleResult {
  ruleId: string;
  points: number;
  note: string;
}
/** Injectable random source so consequence rolls are testable and reproducible. */
export type Rng = () => number;
