/**
 * Patient Consequence Engine.
 * Turns decisions into possible outcomes and a follow-up timeline.
 * Principles: (1) a poor decision raises the chance of harm, it never guarantees it;
 * (2) the decision is scored separately from the luck of the outcome;
 * (3) the odds are gameplay values, not clinical statistics, and must be reviewed with the case.
 */
import type { DecisionOption } from "../case";
import type { Rng } from "../types";

export interface RiskInputs {
  missedKeyAdvice: number;
  harmfulAdvice: number;
  fracture: boolean;
  haemostasisConfirmed: boolean;
}
export interface Odds {
  drySocket: number;
  bleed: number;
}
export function complicationOdds(i: RiskInputs): Odds {
  return {
    drySocket: Math.min(0.85, 0.08 + 0.22 * i.missedKeyAdvice + 0.18 * i.harmfulAdvice + (i.fracture ? 0.1 : 0)),
    bleed: i.haemostasisConfirmed ? 0.05 : 0.5,
  };
}
export function rollFracture(option: DecisionOption, rng: Rng): boolean {
  return option.fractureOdds > 0 && rng() < option.fractureOdds;
}
export interface RunOutcome {
  decisionId: string;
  fracture: boolean;
  bleed: boolean;
  drySocket: boolean;
}
export function rollAftermath(decisionId: string, fracture: boolean, risk: Omit<RiskInputs, "fracture">, rng: Rng): RunOutcome {
  const odds = complicationOdds({ ...risk, fracture });
  return { decisionId, fracture, drySocket: rng() < odds.drySocket, bleed: rng() < odds.bleed };
}

export type Possibility = "happened" | "did-not-happen" | null;
export interface TimelineNode {
  when: "During the procedure" | "Same evening" | "Day 3" | "Week 3" | "Month 3";
  text: string;
  /** Marks a possible outcome and whether it occurred this run, so nothing reads as inevitable. */
  possibility: Possibility;
  patientReturns?: boolean;
  /** Present when the returning patient needs a management decision. */
  returnDecision?: "dry-socket";
}
export function buildTimeline(o: RunOutcome, haemostasisConfirmed: boolean): TimelineNode[] {
  const during =
    o.decisionId === "safe" ? "Planned sectioning with senior support. Uneventful."
    : o.decisionId === "abandon" ? "Extraction completed by a senior after you stopped without a plan."
    : o.fracture ? "Root fracture. Root tip retrieved surgically by your supervisor."
    : "Tooth delivered whole after continuing against resistance.";
  const risky = o.decisionId === "force" || o.decisionId === "twist";
  return [
    { when: "During the procedure", text: during, possibility: risky ? (o.fracture ? "happened" : "did-not-happen") : null },
    {
      when: "Same evening",
      text: o.bleed ? "He phones two hours later. The socket is oozing. He is talked through firm pressure on fresh gauze and it stops." : "He leaves with a stable clot. No calls tonight.",
      possibility: o.bleed ? "happened" : haemostasisConfirmed ? null : "did-not-happen",
    },
    o.drySocket
      ? { when: "Day 3", text: "Throbbing pain that began on day 2, and a bad taste. The socket looks empty, with bare bone showing. No pus, no fever, no swelling.", possibility: "happened", patientReturns: true, returnDecision: "dry-socket" }
      : { when: "Day 3", text: "A routine review. The clot is in place and the gum is closing. He is comfortable.", possibility: "did-not-happen", patientReturns: true },
    {
      when: "Week 3",
      text: o.fracture ? "Healing is slower after the surgical retrieval. Still tender on chewing, and improving."
        : o.drySocket ? "The socket has filled in after the dry socket. His pain settled about a week after the dressing."
        : "The gum has closed over the socket. No complaints.",
      possibility: null,
    },
    { when: "Month 3", text: "The socket has healed. He asks what his options are for the gap. That is a new case, in prosthodontics.", possibility: null },
  ];
}
