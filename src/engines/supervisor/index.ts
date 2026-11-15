/**
 * AI Supervisor Engine.
 * Four fictional personalities. They differ only in voice: every one reacts to the same events
 * and is paired with the same rule fact, so tone can never change the clinical content.
 * Lines are authored, not generated. An LLM may later rephrase a line but never the fact.
 */
import type { SupervisorId } from "../types";

export interface Persona {
  id: SupervisorId;
  name: string;
  tag: string;
  blurb: string;
  colour: string;
}
export const SUPERVISOR_ORDER: SupervisorId[] = ["mentor", "strict", "roast", "osce"];
export const PERSONAS: Record<SupervisorId, Persona> = {
  mentor: { id: "mentor", name: "Dr. Mira Sol", tag: "Supportive Mentor", blurb: "Calm and encouraging.", colour: "#7be495" },
  strict: { id: "strict", name: "Prof. Ironwood", tag: "Strict Supervisor", blurb: "Serious about patient safety.", colour: "#8fd8ff" },
  roast: { id: "roast", name: "Dr. Blaze", tag: "Roast Mode", blurb: "Sarcastic about your decisions, never about you.", colour: "#ff6f7d" },
  osce: { id: "osce", name: "Examiner 7", tag: "OSCE Examiner", blurb: "Formal. Minimal feedback.", colour: "#ffc857" },
};
export type Expression = "neutral" | "happy" | "stern" | "shock";

const q = (mentor: string, strict: string, roast: string, osce: string): Record<SupervisorId, string> => ({ mentor, strict, roast, osce });

export const LINES = {
  intro: q("Take your time. I'm right here, and every step has a reason we'll talk through.", "You are responsible for this patient from now until he leaves. Begin.", "Fresh gloves, fresh confidence. Let's see which one lasts longer.", "This station is a simple extraction. You may begin. I will not prompt you."),
  good: q("Nicely done. That's exactly the habit to build.", "Correct. Continue.", "Annoyingly correct. I had a joke ready and everything.", "Noted."),
  wrongSite: q("Easy slip to make. Check the notes and the radiograph, then choose again.", "Wrong tooth. This is the one error you never get to make. Verify the site.", "Bold choice, removing a tooth nobody complained about. The notes say 46.", "Incorrect site identified."),
  wrongAnaesthetic: q("Not quite. Think about which nerves supply a lower molar and its gum.", "That will not anaesthetise a mandibular molar reliably. Think anatomy.", "That injection is doing great work on a tooth we are not removing.", "Technique selected would not be expected to achieve anaesthesia."),
  untestedAnaesthesia: q("Always confirm numbness first. It protects his trust in you.", "You do not start until you have tested. 'Feels funny' is not a test.", "'He said it feels funny' is a vibe, not a clinical finding.", "Candidate did not confirm anaesthesia."),
  wrongElevator: q("Have another look at the tray. Match the instrument to the job.", "Wrong instrument. Know your tray before you touch a patient.", "That instrument has many talents. This isn't one of them.", "Incorrect instrument selected."),
  wrongForceps: q("Have another look. Match the forceps to the arch and the tooth.", "Wrong forceps. Upper and lower patterns are not interchangeable.", "Those forceps are lovely. For a different jaw.", "Incorrect instrument selected."),
  wrongFulcrum: q("Close. The fulcrum should be bone, never a neighbour or a weak crown.", "No. You lever on bone. You do not lever on the adjacent tooth.", "That spot did nothing to deserve being used as a crowbar rest.", "Incorrect point of application."),
  excessiveForce: q("Ease off a little. Controlled force, and let the ligament give.", "Too much force. Control, not strength.", "This is an extraction, not an arm-wrestling final.", "Excessive force observed."),
  jerkyMovement: q("Slow it down. Hold the pressure and let the socket expand.", "Jerky. Sustained, controlled movement only.", "That was less controlled movement, more opening a stuck jar.", "Uncontrolled movement observed."),
  jawUnsupported: q("Remember the other hand. Supporting the jaw protects the joint.", "Your other hand has a job. Support the mandible.", "Your other hand isn't on a tea break. Support that jaw.", "Mandible not supported."),
  decisionSafe: q("That's the mature call. Stopping to reassess is a skill, not a failure.", "Correct. You stopped, reassessed and planned. That is the standard.", "Look at that, a decision made by the brain and not the biceps.", "Candidate stops and reassesses. Appropriate."),
  decisionForce: q("I understand the urge to push through. Resistance is information, though.", "Unacceptable. Unexpected resistance means stop, not push harder.", "When the tooth says no, 'push harder' isn't a treatment plan.", "Candidate continues with increased force. Unsafe."),
  decisionTwist: q("Good instinct to change something, but twisting a two-rooted tooth works against you.", "No. You do not rotate a multi-rooted tooth.", "Rotating a molar with two spread roots. The roots would like a word.", "Candidate applies rotational force to a multi-rooted tooth. Unsafe."),
  decisionAbandon: q("Stopping was right. He still needs a plan and a senior before he leaves.", "You stopped. Then you left him with no plan. Half a decision.", "You stopped, which is great. Then you ghosted the patient, which isn't.", "Candidate stops without a management plan. Incomplete."),
  luckyEscape: q("It came out whole this time. Let's still talk about why that was a risk.", "It held. That was luck, and luck is not a technique.", "It worked. So does crossing the road blindfolded, sometimes.", "Outcome uneventful. Decision remains unsafe."),
  rootFracture: q("That crack is a root fracture. What matters now is what we do next.", "Root fractured. This was avoidable. Call your senior now.", "And there's the crack. The radiograph did try to warn you.", "Root fracture. Candidate should escalate."),
  checksGood: q("Good checks. He leaves safe.", "Checks complete. Good.", "Thorough. I'm almost disappointed.", "Pre-discharge checks complete."),
  checksIncomplete: q("One or two checks slipped. They take seconds and they matter.", "Incomplete checks. Nobody leaves your chair unchecked.", "Skipping the checks is a brave way to find out later.", "Pre-discharge checks incomplete."),
  adviceGood: q("Clear, complete advice. He'll know exactly what to do tonight.", "Adequate instructions. Good.", "Advice so clear even I couldn't misread it. Rare.", "Post-operative instructions adequate."),
  adviceIncomplete: q("A few gaps there. Good advice protects the clot.", "Incomplete or harmful advice. The clot is your responsibility too.", "Some of that advice is a great way to see him again on day three.", "Post-operative instructions incomplete."),
  patientReturnsDrySocket: q("He's back and sore. Let's work out what this is and settle him.", "Your patient is back in pain. Assess him properly.", "Guess who's back. He's brought his socket and some opinions.", "Patient re-attends on day three with pain."),
  returnManagedWell: q("Exactly right. Gentle, comfortable and reassuring.", "Correct management.", "Correct. I've put my roast away, reluctantly.", "Appropriate management."),
  returnManagedPoorly: q("Not the first choice here. Look at what actually settles this.", "No. Review how this condition is managed.", "A confident choice. The socket disagrees.", "Management not appropriate."),
  healedReview: q("He's healing well. A quick review is a nice end to the story.", "Healing as expected. Discharge.", "He's fine. I came all this way to roast and he's fine.", "Review uneventful."),
  bleedAtHome: q("A call about bleeding. Pressure sorted it, and now you know why we check.", "He bled at home. Haemostasis is confirmed in the chair, not hoped for.", "He's redecorating his pillow. Next time, check before he leaves.", "Post-operative bleeding reported."),
  endHigh: q("A really safe, thoughtful run. Be proud of that.", "Acceptable. Maintain this standard.", "Fine. You were good. Don't make it weird.", "Candidate performance: satisfactory."),
  endMid: q("Solid in places. Replay the steps you lost points on.", "Inconsistent. Review the flagged steps and repeat.", "A performance with range. Some of it was even dentistry.", "Candidate performance: borderline."),
  endLow: q("Tough run. That's what practice is for. Go again with the hints on.", "Not acceptable for clinic. Repeat the station.", "The good news is the patient is synthetic. Go again.", "Candidate performance: unsatisfactory."),
} as const;
export type SupervisorEvent = keyof typeof LINES;

export interface Reaction {
  persona: Persona;
  line: string;
  /** Shared clinical fact. Identical for every personality. */
  fact: string;
  expression: Expression;
}
export function react(event: SupervisorEvent, supervisor: SupervisorId, fact = "", expression: Expression = "neutral"): Reaction {
  return { persona: PERSONAS[supervisor], line: LINES[event][supervisor], fact, expression };
}
export function closingEvent(score: number): SupervisorEvent {
  return score >= 85 ? "endHigh" : score >= 55 ? "endMid" : "endLow";
}
