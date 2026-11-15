/**
 * Procedure Simulation Engine.
 * A registry of reusable interaction modules. A case step names a module by kind; the player
 * renders it. Procedures get the mechanic that suits them instead of one quiz template.
 */
export interface SimulationModule {
  kind: string;
  name: string;
  dimension: "2D" | "3D";
  status: "demo" | "planned";
  usedFor: string;
}
export const MODULES: SimulationModule[] = [
  { kind: "site-select", name: "Tooth and site selection", dimension: "2D", status: "demo", usedFor: "Correct-site checks on an arch chart" },
  { kind: "choice", name: "Instrument and technique choice", dimension: "2D", status: "demo", usedFor: "Tray selection, technique decisions" },
  { kind: "pressure-hold", name: "Controlled force gauge", dimension: "2D", status: "demo", usedFor: "Luxation, condensation, any steady-force step" },
  { kind: "alternate-hold", name: "Alternating sustained movement", dimension: "2D", status: "demo", usedFor: "Forceps delivery" },
  { kind: "decision", name: "Branching clinical decision", dimension: "2D", status: "demo", usedFor: "Decision points with consequences" },
  { kind: "multi-select", name: "Checklist", dimension: "2D", status: "demo", usedFor: "Pre-discharge checks, aftercare, consent" },
  { kind: "needle-path", name: "Suture needle path", dimension: "2D", status: "planned", usedFor: "Suturing and tissue approximation" },
  { kind: "image-annotate", name: "Image interpretation and annotation", dimension: "2D", status: "planned", usedFor: "Radiology, lesion recognition" },
  { kind: "timed-triage", name: "Time-pressured decisions", dimension: "2D", status: "planned", usedFor: "Medical emergencies, First Day shift" },
  { kind: "component-design", name: "Component picker on a cast", dimension: "2D", status: "planned", usedFor: "RPD surveying and design" },
  { kind: "canal-map", name: "Canal anatomy explorer", dimension: "3D", status: "planned", usedFor: "Access, canal location, working length" },
  { kind: "prep-reduction", name: "Preparation and reduction viewer", dimension: "3D", status: "planned", usedFor: "Crown and bridge preparation" },
  { kind: "fracture-reduction", name: "Fracture reduction and plating", dimension: "3D", status: "planned", usedFor: "ORIF planning, arch bars" },
  { kind: "tooth-movement", name: "Tooth movement planner", dimension: "3D", status: "planned", usedFor: "Orthodontic planning" },
];
export function moduleFor(kind: string): SimulationModule | undefined {
  return MODULES.find((m) => m.kind === kind);
}
/** Stated wherever a score is shown: screen interaction is not evidence of real motor skill. */
export const MOTOR_SKILL_DISCLAIMER = "On-screen simulation does not validate real-world surgical motor competence.";
