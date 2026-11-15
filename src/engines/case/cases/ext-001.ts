/**
 * EXT-001: Simple extraction of tooth 46.
 * DEMO CONTENT. NOT CLINICALLY APPROVED. Synthetic patient.
 * Rules, wording and odds were drafted by an AI assistant and have had no clinician review.
 */
import type { CaseDefinition } from "../index";

export const EXT_001: CaseDefinition = {
  id: "EXT-001",
  slug: "simple-extraction-46",
  procedureSlug: "simple-extraction",
  title: "Simple extraction, tooth 46",
  level: 1,
  status: "draft",
  demo: true,
  synthetic: true,
  patient: { label: "Synthetic patient P-046", age: 54, sex: "male" },
  complaint: "Throbbing pain lower right for two weeks, worse at night. Wants the tooth out.",
  history: [
    "Hypertension, controlled on amlodipine. Today 132/84",
    "No anticoagulants or antiplatelets",
    "No known allergies",
    "Smokes about 10 cigarettes a day",
  ],
  findings: "46 grossly carious and broken down, not restorable. Tender to percussion.",
  radiograph: "Deep caries into the pulp of 46. Dark area at the mesial root tip. Distal root curves towards 47.",
  rules: {
    S1: { id: "S1", label: "Correct site confirmed", max: 10, domain: "Safety", safetyCritical: true, fact: "Confirm the site against the notes, the radiograph and the patient. Tooth 46 is the lower right first molar." },
    A1: { id: "A1", label: "Anaesthetic technique", max: 6, domain: "Technique", safetyCritical: false, fact: "The inferior alveolar block numbs the tooth and usually the lingual gum. The long buccal injection covers the buccal gum." },
    A2: { id: "A2", label: "Anaesthesia tested before starting", max: 4, domain: "Safety", safetyCritical: true, fact: "Test before you start: lip numbness, then probe the gum on both sides of the tooth." },
    I1: { id: "I1", label: "Instrument to loosen", max: 5, domain: "Technique", safetyCritical: false, fact: "A simple extraction starts by loosening the tooth with an elevator to tear the periodontal ligament." },
    I2: { id: "I2", label: "Instrument to deliver", max: 5, domain: "Technique", safetyCritical: false, fact: "Forceps match the arch and the tooth. Lower molar forceps have beaks set at a right angle to the handles." },
    T1: { id: "T1", label: "Elevator point of application", max: 10, domain: "Technique", safetyCritical: false, fact: "The elevator goes between tooth and bone, with crestal bone as the fulcrum. Never lever on a neighbouring tooth." },
    T2: { id: "T2", label: "Controlled luxation force", max: 10, domain: "Technique", safetyCritical: false, fact: "Force should be controlled and steady. Bursts of high force risk fracture of tooth or bone." },
    S2: { id: "S2", label: "Mandible supported", max: 8, domain: "Safety", safetyCritical: true, fact: "The non-working hand supports the lower jaw against your force. That protects the jaw joint and lets you feel the socket expand." },
    T3: { id: "T3", label: "Controlled forceps movement", max: 7, domain: "Technique", safetyCritical: false, fact: "Slow, sustained buccal and lingual pressure expands the socket. Jerky movements break teeth." },
    D1: { id: "D1", label: "Response to unexpected resistance", max: 20, domain: "Judgement", safetyCritical: true, fact: "Unexpected resistance means stop and reassess. The radiograph shows a curved distal root, so dividing the tooth with senior support is the planned alternative." },
    C1: { id: "C1", label: "Checks before discharge", max: 5, domain: "Safety", safetyCritical: true, fact: "Before he leaves: check the tooth is complete, and confirm the bleeding is controlled." },
    C2: { id: "C2", label: "Aftercare advice", max: 10, domain: "Aftercare", safetyCritical: false, fact: "Aftercare advice protects the blood clot: pressure, no vigorous rinsing, no smoking, and clear advice on when to come back." },
  },
  steps: [
    { kind: "site-select", id: "site", ruleId: "S1", kicker: "Step 1 · Safety check", title: "Tap the tooth you are about to remove", correctTooth: 46, badEvent: "wrongSite" },
    {
      kind: "choice", id: "anaesthetic", ruleId: "A1", kicker: "Step 2 · Local anaesthesia", title: "How will you numb tooth 46?", badEvent: "wrongAnaesthetic",
      hint: "Lower molars sit in thick bone. Think of a nerve block, plus the cheek-side gum.",
      options: [
        { id: "infiltration", text: "Buccal infiltration next to 46 only", why: "In this demo rule set, infiltration alone is treated as unreliable for an adult lower molar extraction." },
        { id: "ianb", text: "Inferior alveolar nerve block, plus a long buccal injection", correct: true },
        { id: "psa", text: "Posterior superior alveolar block", why: "That block is for upper molars." },
      ],
    },
    {
      kind: "choice", id: "test-anaesthesia", ruleId: "A2", kicker: "Step 2 · Local anaesthesia", title: "Four minutes later, he says his lip feels funny.", badEvent: "untestedAnaesthesia",
      hint: "What can you check objectively before picking up an instrument?",
      options: [
        { id: "start", text: "Pick up the elevator and start", why: "A subjective report is not a test. Starting on a tooth that is not numb hurts him and loses his trust." },
        { id: "more", text: "Give a second full cartridge straight away, to be safe", why: "Test first. More anaesthetic without checking adds dose and tells you nothing." },
        { id: "test", text: "Confirm lip numbness, then probe the gum on both sides of 46", correct: true },
      ],
    },
    {
      kind: "choice", id: "elevator", ruleId: "I1", kicker: "Step 3 · Instrument tray", title: "Pick the instrument that loosens the tooth first", badEvent: "wrongElevator",
      hint: "You need a blade that slides between tooth and bone.",
      options: [
        { id: "scaler", text: "Sickle scaler", icon: "scaler", why: "A scaler removes calculus. It is not built to take leverage." },
        { id: "bur", text: "High-speed handpiece and bur", icon: "handpiece", why: "A bur belongs to a surgical approach. A simple extraction starts by loosening." },
        { id: "elevator", text: "Straight elevator", icon: "elevator", correct: true },
      ],
    },
    {
      kind: "choice", id: "forceps-pick", ruleId: "I2", kicker: "Step 3 · Instrument tray", title: "Now pick the forceps that deliver it", badEvent: "wrongForceps",
      hint: "Lower forceps have beaks at a right angle to the handles.",
      options: [
        { id: "lower-molar", text: "Lower molar forceps", icon: "forceps-lower", correct: true },
        { id: "upper-molar", text: "Upper molar forceps", icon: "forceps-upper", why: "Upper forceps run nearly straight. They cannot seat properly on a lower molar." },
        { id: "bayonet", text: "Upper root forceps, bayonet pattern", icon: "forceps-bayonet", why: "Bayonet forceps reach upper roots at the back of the mouth." },
      ],
    },
    {
      kind: "choice", id: "fulcrum", ruleId: "T1", kicker: "Step 4 · Elevator", title: "Where does the elevator go?", badEvent: "wrongFulcrum",
      hint: "Bone can take the load. Teeth and decayed crowns cannot.",
      options: [
        { id: "B", text: "B. Rest it on tooth 45 and lever against it", why: "Levering on a neighbour can loosen or damage a healthy tooth." },
        { id: "A", text: "A. Between 46 and the bone crest, blade facing 46, turning on the bone", correct: true },
        { id: "C", text: "C. Hook it into the decayed crown and lift", why: "The decayed crown is the weakest part of the tooth. It will break off." },
      ],
    },
    { kind: "pressure-hold", id: "luxate", ruleId: "T2", kicker: "Step 5 · Loosen the tooth", title: "Hold to press. Stay in the green.", strikePenalty: 3, badEvent: "excessiveForce" },
    {
      kind: "choice", id: "other-hand", ruleId: "S2", kicker: "Step 6 · Forceps on", title: "What is your other hand doing?", badEvent: "jawUnsupported",
      hint: "Your working hand will push down on the lower jaw. Something has to push back.",
      options: [
        { id: "chest", text: "Resting on the patient's chest", why: "The jaw is left unsupported against your force." },
        { id: "support", text: "Supporting the lower jaw and guarding the cheek and tongue", correct: true },
        { id: "forehead", text: "Holding the patient's forehead still", why: "The forehead is not what moves. The lower jaw is." },
      ],
    },
    { kind: "alternate-hold", id: "deliver", ruleId: "T3", kicker: "Step 7 · Deliver the tooth", title: "Hold each side until the bar fills", strikePenalty: 2, movesToDecision: 5, badEvent: "jerkyMovement" },
    {
      kind: "decision", id: "resistance", ruleId: "D1", kicker: "Step 8 · Clinical decision", title: "The tooth stops moving",
      prompt: "Five good movements in, 46 locks. The broken-down crown starts to flex between the beaks, and the roots are not following. What do you do?",
      options: [
        { id: "force", text: "Squeeze harder and push through", points: 0, event: "decisionForce", fractureOdds: 0.65 },
        { id: "safe", text: "Stop. Re-read the radiograph, loosen again, and plan to divide the tooth with senior support", points: 20, event: "decisionSafe", fractureOdds: 0 },
        { id: "twist", text: "Switch to a strong twisting movement", points: 0, event: "decisionTwist", fractureOdds: 0.65 },
        { id: "abandon", text: "Stop, and send him home for today", points: 6, event: "decisionAbandon", fractureOdds: 0 },
      ],
    },
    {
      kind: "multi-select", id: "checks", ruleId: "C1", kicker: "Step 9 · Before he leaves the chair", title: "Tick everything you would do", perCorrect: 5 / 3, perHarmful: 5 / 3, goodEvent: "checksGood", badEvent: "checksIncomplete",
      options: [
        { id: "inspect", text: "Inspect the removed tooth: are the roots and tips complete?", correct: true },
        { id: "probe", text: "Probe deep into the socket with the elevator to feel for the nerve" },
        { id: "haemostasis", text: "Have him bite on gauze, then confirm the bleeding has stopped", correct: true, key: true },
        { id: "discharge", text: "Discharge him now. It will stop on the way home" },
        { id: "socket", text: "Check the socket and gently squeeze its walls back together", correct: true },
      ],
    },
    {
      kind: "multi-select", id: "aftercare", ruleId: "C2", kicker: "Step 10 · Aftercare advice", title: "What do you tell him? Tick all that apply", perCorrect: 2, perHarmful: 2, goodEvent: "adviceGood", badEvent: "adviceIncomplete",
      options: [
        { id: "gauze", text: "Bite firmly on the gauze for 20 to 30 minutes", correct: true },
        { id: "mouthwash", text: "Rinse hard with mouthwash as soon as you get home" },
        { id: "no-rinse", text: "No vigorous rinsing or spitting for the first 24 hours", correct: true, key: true },
        { id: "no-smoke", text: "Avoid smoking for as long as you can, at least 48 hours", correct: true, key: true },
        { id: "straw", text: "Drink through a straw to keep fluids off the socket" },
        { id: "diet", text: "Soft food, chew on the other side, nothing hot while numb", correct: true },
        { id: "aspirin", text: "Put an aspirin tablet on the socket if it hurts" },
        { id: "return", text: "Come back if bleeding will not stop with pressure, or pain and swelling get worse", correct: true },
      ],
    },
  ],
};
