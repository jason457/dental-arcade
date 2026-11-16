/**
 * Simple Extraction: the hands-on player.
 * Framework-free so the same code runs inside the Next.js app and as a standalone page.
 * All scoring, supervisor lines, consequences and reporting come from the engines; this file
 * only draws the scene and turns touches into engine inputs.
 *
 * DEMO CONTENT. NOT CLINICALLY APPROVED. Synthetic patient.
 */
import { buildReport } from "../engines/analytics";
import { getCase, type Step } from "../engines/case";
import { buildTimeline, rollAftermath, rollFracture, type RunOutcome, type TimelineNode } from "../engines/consequence";
import { scoreChoice, scoreDecision, scoreMultiSelect, scoreSiteSelect, scoreStrikes, totalScore } from "../engines/decision";
import { MOTOR_SKILL_DISCLAIMER } from "../engines/simulation";
import { PERSONAS, SUPERVISOR_ORDER, closingEvent, react, type Expression, type SupervisorEvent } from "../engines/supervisor";
import type { PracticeMode, RuleResult, SupervisorId } from "../engines/types";
import * as art from "./art";
import { CSS } from "./styles";

interface Zone { id: string; x: number; y: number; r: number }
interface ToolDef { id: string; label: string; instant?: boolean }
interface Run {
  first?: string; decision?: string; fracture?: boolean; rewound?: boolean;
  haem?: boolean; missedKeys?: number; harmful?: number;
  outcome?: RunOutcome; timeline?: TimelineNode[]; retFirstTime?: boolean;
}

const PIPS = 10;
const SPECIALIST = [
  "Why stop? A tooth that was moving and then locks is usually held by the shape of its roots or by the bone. More force goes to the weakest part first. Here that is the decayed crown or the curved distal root.",
  "If you push on, possible outcomes include the tooth coming out whole, the crown breaking off, or a root tip left behind that needs a surgical approach. None of them is guaranteed.",
  "Planned sectioning: the tooth is divided through the point where the roots split, so each root leaves along its own path. That is a surgical step for a trained operator. The student-level decision is to stop and bring in a senior.",
];
const TILE_ICON: Record<string, string> = {
  force: '<path d="M8 24h12M40 24H28M14 18l6 6-6 6M34 18l-6 6 6 6" stroke-width="4"/>',
  safe: '<rect x="8" y="8" width="22" height="28" rx="2" stroke-width="3"/><path d="M14 16c4-4 8 4 10 0M19 18v12" stroke-width="2.5"/><path d="M36 14v14M36 34v2" stroke-width="5"/>',
  twist: '<path d="M38 24a14 14 0 1 1-6-11.5" stroke-width="4"/><path d="M30 6l3 7-8 1" stroke-width="4"/>',
  abandon: '<rect x="12" y="6" width="20" height="36" rx="2" stroke-width="3"/><circle cx="27" cy="25" r="2" fill="currentColor"/><path d="M36 24h8M40 20l4 4-4 4" stroke-width="3"/>',
};

export function mountExtraction(root: HTMLElement): () => void {
  const c = getCase("simple-extraction-46")!;
  const stepOf = <K extends Step["kind"]>(id: string) => c.steps.find((s) => s.id === id) as Extract<Step, { kind: K }>;
  const whyOf = (stepId: string, optId: string) => stepOf<"choice">(stepId).options.find((o) => o.id === optId)?.why ?? "";

  const S = {
    sup: "mentor" as SupervisorId, mode: "guided" as PracticeMode, voice: false, i: 0,
    results: new Map<string, RuleResult>(), wrong: {} as Record<string, number>, run: {} as Run,
    last: null as null | { e: SupervisorEvent; f: string; x: Expression; line?: string },
    raf: 0, timers: [] as number[],
  };

  if (!document.getElementById("da-css")) {
    const st = document.createElement("style"); st.id = "da-css"; st.textContent = CSS; document.head.appendChild(st);
  }
  root.innerHTML = `<div class="da">
    <div class="da-hud"><div class="da-pips" aria-hidden="true"></div><span class="da-score">000</span><button type="button" class="da-icon" data-act="sup">Supervisor</button></div>
    <div><p class="da-kick"></p><h2></h2></div>
    <div class="da-stage"></div>
    <div class="da-tray"></div>
    <p class="da-msg" aria-live="polite"></p>
    <div class="da-extra"></div>
    <div class="da-actions"></div>
    <div class="da-sup" aria-live="polite"></div>
    <div class="da-modal" role="dialog" aria-modal="true"><div></div></div>
  </div>`;
  const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = root) => el.querySelector(sel) as T;
  const wrap = $(".da"), hud = $(".da-hud"), kickEl = $(".da-kick"), titleEl = $("h2"), stage = $(".da-stage"), tray = $(".da-tray"),
    msgEl = $(".da-msg"), extra = $(".da-extra"), actions = $(".da-actions"), supBox = $(".da-sup"), modal = $(".da-modal"), modalIn = $(".da-modal>div");

  // ───────── shared helpers ─────────
  const later = (fn: () => void, ms: number) => { const t = window.setTimeout(fn, ms); S.timers.push(t); return t; };
  const total = () => totalScore([...S.results.values()]);
  const record = (r: RuleResult) => { S.results.set(r.ruleId, r); $(".da-score").textContent = String(total()).padStart(3, "0"); };
  const msg = (t: string) => { msgEl.textContent = t; };
  const shake = () => { stage.classList.remove("da-shake"); void stage.offsetWidth; stage.classList.add("da-shake"); };
  const svg = () => $<SVGSVGElement>("svg.da-svg", stage);
  const fx = (html: string) => { const g = $("#fx", stage); if (g) g.insertAdjacentHTML("beforeend", html); };

  function say(e: SupervisorEvent, fact = "", expr: Expression = "neutral", lineOverride?: string) {
    S.last = { e, f: fact, x: expr, line: lineOverride };
    const r = react(e, S.sup, fact, expr), line = lineOverride ?? r.line;
    supBox.innerHTML = `<div class="da-say">${art.supervisorFace(r.persona.colour, r.persona.id, expr)}<div><b>${r.persona.name.toUpperCase()} · ${r.persona.tag.toUpperCase()}</b><div class="l">${line}</div>${fact ? `<div class="f">${fact}</div>` : ""}</div></div>`;
    if (S.voice) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(line)); } catch { /* voice is optional */ } }
  }
  /** A neutral prompt in the supervisor box that is the same for every personality. */
  const prompt = (line: string, fact = "") => say("good", fact, "neutral", S.sup === "osce" ? "Proceed." : line);

  function bubble(text: string) {
    let b = $(".da-bubble", stage);
    if (!b) { b = document.createElement("div"); b.className = "da-bubble"; stage.appendChild(b); }
    b.textContent = text; b.classList.add("on");
    later(() => b.classList.remove("on"), 2200);
  }
  /** Records a mistake. Returns true when the step is now locked (unguided mode). */
  function miss(ruleId: string, evt: SupervisorEvent, why: string, expr: Expression = "stern") {
    S.wrong[ruleId] = (S.wrong[ruleId] ?? 0) + 1;
    say(evt, why, expr); msg(why); shake();
    return S.mode === "unguided";
  }
  const settle = (ruleId: string) => { if (!S.results.has(ruleId)) record(scoreChoice(c.rules[ruleId], S.wrong[ruleId] ?? 0, S.mode)); };

  function scene(kick: string, title: string, stageHtml: string, plain = false) {
    kickEl.textContent = kick; titleEl.textContent = title; titleEl.style.display = title ? "" : "none";
    stage.className = "da-stage" + (plain ? " plain" : stageHtml.includes('viewBox="0 0 160 180"') ? " front" : ""); stage.innerHTML = stageHtml;
    tray.innerHTML = ""; extra.innerHTML = ""; actions.innerHTML = ""; msg("");
    zones = []; onDrop = null; armed = null;
    wrap.scrollIntoView({ block: "start" });
  }
  function button(label: string, fn: () => void, cls = "da-go", into: HTMLElement = actions) {
    const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.onclick = fn; into.appendChild(b); return b;
  }
  const nextBtn = (label = "Continue") => { $("[data-next]", actions)?.remove(); const b = button(`${label} ▶`, () => go(S.i + 1)); b.dataset.next = "1"; return b; };
  function hintBtn(text?: string) {
    if (S.mode !== "guided" || !text) return;
    const b = button("Show a hint", () => { msg(`Hint: ${text}`); b.remove(); }, "da-ghostbtn");
  }
  function openModal(html: string, onClose?: () => void) {
    modalIn.innerHTML = html; modal.classList.add("on"); modal.scrollTop = 0;
    button("CLOSE", () => { modal.classList.remove("on"); onClose?.(); }, "da-go", modalIn);
  }

  // ───────── drag and drop: pick a tool off the tray, drop it on the patient ─────────
  let zones: Zone[] = [];
  let onDrop: ((tool: string, zone: string | null) => void) | null = null;
  let armed: string | null = null;

  function rings(on: boolean) {
    const g = $("#zones", stage); if (!g) return;
    g.innerHTML = on && S.mode === "guided" ? zones.map((z) => `<circle class="da-ring" cx="${z.x}" cy="${z.y}" r="${z.r}"/>`).join("") : "";
  }
  function arm(id: string | null) {
    armed = id;
    tray.querySelectorAll(".da-tool").forEach((t) => t.classList.toggle("armed", (t as HTMLElement).dataset.tool === id));
    stage.classList.toggle("armed", !!id); rings(!!id);
  }
  function dropAt(cx: number, cy: number, tool: string) {
    const s = svg(); arm(null);
    if (!s || !onDrop) return;
    const b = s.getBoundingClientRect();
    if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) return;
    const m = s.getScreenCTM(); if (!m) return;
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    let best: Zone | null = null, bd = Infinity;
    for (const z of zones) { const d = Math.hypot(z.x - p.x, z.y - p.y); if (d <= z.r && d < bd) { best = z; bd = d; } }
    onDrop(tool, best ? best.id : null);
  }
  function setTray(tools: ToolDef[]) {
    tray.innerHTML = tools.map((t) => `<button type="button" class="da-tool" data-tool="${t.id}">${art.TOOL_ART[t.id]}<span>${t.label}</span></button>`).join("");
    tray.querySelectorAll<HTMLElement>(".da-tool").forEach((el) => {
      const def = tools.find((t) => t.id === el.dataset.tool)!;
      let sx = 0, sy = 0, down = false, ghost: HTMLElement | null = null;
      el.onpointerdown = (e) => { e.preventDefault(); down = true; sx = e.clientX; sy = e.clientY; try { el.setPointerCapture(e.pointerId); } catch { /* not all pointers capture */ } };
      el.onpointermove = (e) => {
        if (!down) return;
        if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
          ghost = document.createElement("div"); ghost.className = "da-ghost"; ghost.innerHTML = art.TOOL_ART[def.id]; document.body.appendChild(ghost);
          arm(def.id);
        }
        if (ghost) { ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`; }
      };
      const end = (e: PointerEvent, cancelled: boolean) => {
        if (!down) return; down = false;
        if (ghost) { ghost.remove(); ghost = null; if (cancelled) arm(null); else dropAt(e.clientX, e.clientY, def.id); }
        else if (!cancelled) { if (def.instant) onDrop?.(def.id, null); else { arm(armed === def.id ? null : def.id); if (armed) msg("Now tap where it goes, or drag it there."); } }
      };
      el.onpointerup = (e) => end(e, false); el.onpointercancel = (e) => end(e, true);
      el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (def.instant) onDrop?.(def.id, null); else arm(armed === def.id ? null : def.id); } };
    });
  }
  stage.addEventListener("click", (e) => { if (armed && (e.target as Element).closest("svg.da-svg")) dropAt(e.clientX, e.clientY, armed); });
  const hideTool = (id: string) => tray.querySelector(`[data-tool="${id}"]`)?.classList.add("gone");

  // ───────── scenes ─────────
  function hudUpdate() {
    const on = S.i >= 2; hud.classList.toggle("on", on); supBox.classList.toggle("on", on);
    $(".da-pips").innerHTML = Array.from({ length: PIPS }, (_, k) => `<i class="${k < S.i - 3 ? "d" : k === S.i - 3 ? "c" : ""}"></i>`).join("");
    $(".da-score").textContent = String(total()).padStart(3, "0");
  }
  function go(i: number) {
    cancelAnimationFrame(S.raf); S.timers.forEach(clearTimeout); S.timers = [];
    document.querySelectorAll(".da-ghost").forEach((g) => g.remove());
    S.i = i; hudUpdate(); SCENES[i]();
  }
  const best = () => { try { return Number(localStorage.getItem("da-best")) || 0; } catch { return 0; } };

  function title() {
    scene("Simulation 001 · Oral surgery", "", `<p class="da-hero">CAN YOU TAKE OUT TOOTH 46?</p><p style="font-weight:600;color:var(--dentine)">Practice like a student. Think like a specialist.</p><div class="da-stage">${art.jawSide({ pdl: true })}</div><p class="da-lead">One synthetic patient. Pick up the instruments, work on the tooth with your own hands, and decide what to do when it stops moving.</p>`, true);
    button("START ▶", () => go(1));
    if (best()) extra.innerHTML = `<p class="da-lab"><span>YOUR BEST</span><span>${best()} / 100</span></p>`;
  }
  function setup() {
    scene("Before you scrub in", "Pick your supervisor", "", true);
    const draw = () => {
      stage.innerHTML = `<div class="da-opts">${SUPERVISOR_ORDER.map((k) => `<button type="button" class="da-opt${S.sup === k ? " sel" : ""}" data-k="${k}">${art.supervisorFace(PERSONAS[k].colour, k, S.sup === k ? "happy" : "neutral")}<span><strong>${PERSONAS[k].tag}</strong><br>${PERSONAS[k].name}. ${PERSONAS[k].blurb}</span></button>`).join("")}</div>
      <h2 style="font-size:18px">Practice mode</h2><div class="da-opts">${([["guided", "Guided", "Target rings, hints and second tries. Mistakes cost points."], ["unguided", "Unguided", "No rings, no hints. Your first move is final."]] as const).map((m) => `<button type="button" class="da-opt${S.mode === m[0] ? " sel" : ""}" data-m="${m[0]}"><span><strong>${m[1]}</strong><br>${m[2]}</span></button>`).join("")}</div>
      <label class="da-check"><input type="checkbox" id="da-voice"${S.voice ? " checked" : ""}><span>Read supervisor lines aloud, using this device's voice</span></label>
      <p class="da-small">Supervisors are fictional characters. All four apply the same demo rules. You can switch at any time.</p>`;
      stage.querySelectorAll<HTMLElement>("[data-k]").forEach((b) => (b.onclick = () => { S.sup = b.dataset.k as SupervisorId; draw(); }));
      stage.querySelectorAll<HTMLElement>("[data-m]").forEach((b) => (b.onclick = () => { S.mode = b.dataset.m as PracticeMode; draw(); }));
      $<HTMLInputElement>("#da-voice", stage).onchange = (e) => { S.voice = (e.target as HTMLInputElement).checked; };
    };
    draw();
    button("Meet the patient ▶", () => { S.results.clear(); S.wrong = {}; S.run = {}; go(2); });
  }
  function brief() {
    scene(`Case ${c.id}`, "Meet your patient", `<div class="da-panel"><dl class="da-facts"><dt>Patient</dt><dd>${c.patient.label}, ${c.patient.age}, ${c.patient.sex}</dd><dt>Complaint</dt><dd>${c.complaint}</dd><dt>History</dt><dd>${c.history.join("<br>")}</dd><dt>Findings</dt><dd>${c.findings}</dd><dt>Plan</dt><dd>Extraction of 46 under local anaesthetic. Consent signed.</dd></dl></div><div class="da-stage">${art.jawSide({ xray: true })}</div><p class="da-small">Stylised drawing in place of a periapical radiograph. ${c.radiograph}</p>`, true);
    say("intro", "Read the radiograph carefully. It matters later.");
    nextBtn("Start the procedure");
  }

  function site() {
    const st = stepOf<"site-select">("site"), rule = c.rules[st.ruleId];
    scene("Step 1 · Safety check", st.title, art.mouth({ numbers: true }));
    prompt("Before anything sharp: which tooth?", "Site check first. Every time.");
    let wrong = 0, done = false;
    const finish = () => { done = true; $(`[data-n="${st.correctTooth}"]`, stage).classList.add("ok"); record(scoreSiteSelect(rule, wrong, S.mode)); nextBtn(); };
    stage.querySelectorAll<SVGGElement>(".da-tooth").forEach((g) => {
      const act = () => {
        if (done) return;
        if (Number(g.dataset.n) === st.correctTooth) { say("good", rule.fact, "happy"); msg(""); finish(); }
        else { wrong++; g.classList.add("no"); const why = `That is tooth ${g.dataset.n}. ${rule.fact}`; say(st.badEvent, why, "shock"); msg(why); shake(); if (S.mode === "unguided") finish(); }
      };
      g.onclick = act; g.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } };
    });
  }

  function inject() {
    const st = stepOf<"choice">("anaesthetic"), rule = c.rules.A1;
    scene("Step 2 · Local anaesthesia", "Give the local anaesthetic", art.mouth({ numbers: true }));
    prompt("Pick up the syringe and place each injection where it belongs.", "A lower molar needs more than one site numbed.");
    setTray([{ id: "syringe", label: "Syringe" }]);
    zones = [{ id: "ianb-r", x: 86, y: 48, r: 22 }, { id: "ianb-l", x: 274, y: 48, r: 22 }, { id: "buccal", x: 46, y: 110, r: 20 }, { id: "tongue", x: 180, y: 118, r: 46 }];
    const given = { block: false, buccal: false };
    const mark = (z: Zone, label: string) => fx(`<circle cx="${z.x}" cy="${z.y}" r="9" fill="#8fd8ff" stroke="#061a1c" stroke-width="2"/><text x="${z.x}" y="${z.y - 14}" text-anchor="middle" font-family="Chakra Petch,sans-serif" font-weight="700" font-size="10" fill="#f6efdc">${label}</text>`);
    const done = () => { settle("A1"); msg(""); hideTool("syringe"); actions.innerHTML = ""; nextBtn(); };
    const locked = () => { if (!given.block) mark(zones[0], "BLOCK"); if (!given.buccal) mark(zones[2], "BUCCAL"); msg(`${msgEl.textContent} Your supervisor completes the anaesthetic.`); done(); };
    onDrop = (_t, z) => {
      if (z === "ianb-r" && !given.block) { given.block = true; mark(zones[0], "BLOCK"); bubble("Small scratch…"); msg("Inferior alveolar nerve block given: aspirated, then injected slowly."); }
      else if (z === "buccal" && !given.buccal) { given.buccal = true; mark(zones[2], "BUCCAL"); bubble("Mm."); msg("Long buccal injection given beside the back molars."); }
      else if (z === "ianb-l") { if (miss("A1", st.badEvent, "That is the patient's left side. Tooth 46 is on the right.", "shock")) locked(); }
      else if (z === "tongue") { bubble("Aagh!"); if (miss("A1", st.badEvent, "The tongue is not an injection site for this tooth.", "shock")) locked(); }
      else if (!z) msg("Bring the needle to the soft tissue inside the mouth.");
    };
    button("Wait for it to work ▶", () => {
      if (given.block && given.buccal) { say("good", rule.fact, "happy"); done(); }
      else if (!given.block && !given.buccal) msg("Nothing has been injected yet.");
      else if (miss("A1", st.badEvent, given.buccal ? whyOf("anaesthetic", "infiltration") : "The block does not cover the cheek-side gum. Add a long buccal injection beside the back molars.")) locked();
    });
    hintBtn("One injection goes behind the last molar on the patient's right, on the inner side. The other goes into the cheek-side gum beside the back molars.");
  }

  function testNumb() {
    const st = stepOf<"choice">("test-anaesthesia"), rule = c.rules.A2;
    scene("Step 2 · Local anaesthesia", st.title, art.mouth({ numbers: true }));
    bubble("My lip feels funny.");
    prompt("He says it feels funny. What do you pick up next?", "");
    setTray([{ id: "elevator", label: "Elevator" }, { id: "probe", label: "Probe" }]);
    const t46 = art.toothPoint(46);
    zones = [{ id: "gum-b", x: 64, y: 148, r: 17 }, { id: "gum-l", x: 122, y: 132, r: 17 }, { id: "tooth", x: t46.x, y: t46.y, r: 15 }];
    const tested = new Set<string>();
    const done = () => { settle("A2"); hideTool("probe"); hideTool("elevator"); nextBtn(); };
    onDrop = (tool, z) => {
      if (tool === "probe") {
        if (z === "gum-b" || z === "gum-l") {
          tested.add(z); const zz = zones.find((q) => q.id === z)!;
          fx(`<circle cx="${zz.x}" cy="${zz.y}" r="8" fill="#7be495" stroke="#061a1c" stroke-width="2"/>`); bubble("Can't feel that.");
          if (tested.size === 2) { say("good", rule.fact, "happy"); msg("Numb on the cheek side and the tongue side. Lip numb too."); done(); }
          else msg("One side tested. Now the other side of the tooth.");
        } else msg("Probe the gum right beside tooth 46: cheek side, then tongue side.");
      } else if (tested.size < 2) {
        bubble("OW! I felt that!");
        if (miss("A2", st.badEvent, whyOf("test-anaesthesia", "start"), "shock")) { msg(`${whyOf("test-anaesthesia", "start")} Your supervisor stops you and tests it.`); done(); }
      }
    };
    hintBtn(st.hint);
  }

  function elevate() {
    const pick = stepOf<"choice">("elevator"), place = stepOf<"choice">("fulcrum"), lux = stepOf<"pressure-hold">("luxate");
    scene("Step 3 · Loosen the tooth", "Pick an instrument and place it", art.jawSide({ pdl: true }));
    prompt("Choose what loosens the tooth, then put its tip exactly where it should work.", "The dotted pink line is the ligament holding 46 in its socket.");
    setTray([{ id: "scaler", label: "Sickle scaler" }, { id: "handpiece", label: "Handpiece + bur" }, { id: "elevator", label: "Straight elevator" }]);
    zones = [{ id: "A", x: 104, y: 97, r: 15 }, { id: "B", x: 68, y: 66, r: 22 }, { id: "C", x: 150, y: 56, r: 22 }];
    const seat = () => {
      settle("I1"); settle("T1"); msg(""); zones = []; onDrop = null; actions.innerHTML = "";
      fx(`<g id="elev"><path d="M104,97 L58,18" stroke="#7fa0a6" stroke-width="10" stroke-linecap="round"/><path d="M104,97 L84,62" stroke="#e8f1f2" stroke-width="4" stroke-linecap="round"/></g>`);
      later(luxate, 500);
    };
    onDrop = (tool, z) => {
      if (tool !== "elevator") {
        hideTool(tool);
        if (miss("I1", pick.badEvent, whyOf("elevator", tool === "handpiece" ? "bur" : "scaler"))) { hideTool(tool === "handpiece" ? "scaler" : "handpiece"); msg(`${msgEl.textContent} The elevator is what you need.`); }
        return;
      }
      settle("I1");
      if (z === "A") { say("good", c.rules.T1.fact, "happy"); seat(); }
      else if (z === "B" || z === "C") {
        fx(z === "B" ? `<path d="M52,40 l-8,-10 M76,36 l8,-12 M64,34 v-14" stroke="#ff5a5a" stroke-width="3" stroke-linecap="round"/>` : `<path d="M138,38 l-6,-12 M150,34 v-14 M162,38 l6,-12" stroke="#ff5a5a" stroke-width="3" stroke-linecap="round"/>`);
        if (miss("T1", place.badEvent, whyOf("fulcrum", z))) { msg(`${msgEl.textContent} Your supervisor repositions the elevator.`); seat(); }
      } else msg("Bring the tip of the elevator right up to the tooth.");
    };
    hintBtn(`${pick.hint} ${place.hint}`);

    function luxate() {
      kickEl.textContent = "Step 3 · Loosen the tooth"; titleEl.textContent = lux.title;
      tray.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;gap:8px"><div class="da-lab"><span>FORCE</span><span>GREEN = CONTROLLED · RED = TOO MUCH</span></div><div class="da-gauge"><div class="z"></div><div class="r"></div><div class="f"></div></div><div class="da-lab"><span>LIGAMENT RELEASED</span><span id="da-pp">0%</span></div><div class="da-bar"><i></i></div><button type="button" class="da-hold">HOLD TO APPLY PRESSURE</button><p class="da-small">Press and release in pulses to keep the force steady.</p></div>`;
      prompt("Gentle, steady pressure. Watch the ligament let go.", c.rules.T2.fact);
      let f = 0, p = 0, hold = false, over = false, strikes = 0, last = performance.now();
      const btn = $<HTMLButtonElement>(".da-hold", tray), ff = $(".da-gauge .f", tray), pb = $(".da-bar i", tray), pp = $("#da-pp", tray), pdl = $("#pdl", stage), t = $("#t46", stage), el = $("#elev", stage);
      const dn = (e: Event) => { e.preventDefault(); hold = true; btn.classList.add("dn"); }, up = () => { hold = false; btn.classList.remove("dn"); };
      btn.onpointerdown = dn; btn.onpointerup = up; btn.onpointerleave = up; btn.onpointercancel = up; btn.oncontextmenu = (e) => e.preventDefault();
      btn.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); hold = true; } }; btn.onkeyup = up;
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        f = Math.max(0, Math.min(100, f + (hold ? 58 : -75) * dt));
        if (f >= 45 && f <= 72) p = Math.min(100, p + 24 * dt);
        if (f > 86 && !over) { over = true; strikes++; say(lux.badEvent, c.rules.T2.fact, "shock"); shake(); }
        if (f < 72) over = false;
        ff.style.width = `${f}%`; pb.style.width = `${p}%`; pp.textContent = `${Math.round(p)}%`; pdl.style.opacity = String(1 - p / 100);
        t.setAttribute("transform", `translate(${(Math.sin(now / 60) * f / 45).toFixed(2)},${(-p / 40).toFixed(2)})`);
        el.setAttribute("transform", `rotate(${(-f / 7).toFixed(1)} 104 97)`);
        if (p >= 100) { btn.disabled = true; btn.textContent = "TOOTH IS MOBILE"; record(scoreStrikes(c.rules.T2, strikes, lux.strikePenalty, "Excessive force")); if (!strikes) say("good", c.rules.T2.fact, "happy"); nextBtn(); }
        else S.raf = requestAnimationFrame(tick);
      };
      S.raf = requestAnimationFrame(tick);
    }
  }

  function deliver() {
    const pick = stepOf<"choice">("forceps-pick"), hand = stepOf<"choice">("other-hand"), mv = stepOf<"alternate-hold">("deliver");
    scene("Step 4 · Forceps", "Pick the forceps and seat them on 46", art.jawSide({}));
    prompt("Three pairs on the tray. Only one fits a lower molar.", "");
    setTray([{ id: "forceps-upper", label: "Upper molar" }, { id: "forceps-lower", label: "Lower molar" }, { id: "forceps-bayonet", label: "Upper root" }]);
    zones = [{ id: "tooth", x: 160, y: 72, r: 52 }];
    onDrop = (tool, z) => {
      if (!z) return msg("Bring the forceps onto tooth 46.");
      if (tool === "forceps-lower") { settle("I2"); say("good", c.rules.I2.fact, "happy"); later(rock, 600); return; }
      hideTool(tool);
      if (miss("I2", pick.badEvent, whyOf("forceps-pick", tool === "forceps-upper" ? "upper-molar" : "bayonet"))) { settle("I2"); msg(`${msgEl.textContent} Your supervisor hands you the lower molar forceps.`); later(rock, 1400); }
    };
    hintBtn(pick.hint);

    function rock() {
      scene("Step 4 · Deliver the tooth", "Rock the tooth: slow, side to side", art.jawFront());
      prompt("Beaks seated low on the roots. Now, what about your other hand?", "");
      setTray([{ id: "hand", label: "Your other hand" }]);
      extra.innerHTML = `<div class="da-lab"><span>HOLD AT THE EDGE</span><span>SOCKET EXPANDING</span></div><div class="da-bar hold"><i id="da-hb"></i></div><div class="da-lab"><span>TOOTH MOBILITY</span><span id="da-mp">0%</span></div><div class="da-bar"><i id="da-mb"></i></div><p class="da-small">Drag the forceps left and right on the picture. Push to one side and hold, then the other.</p>`;
      const s = svg(), rk = $("#rock", stage), hb = $("#da-hb", extra), mb = $("#da-mb", extra), mp = $("#da-mp", extra);
      zones = [{ id: "jaw", x: 80, y: 150, r: 90 }];
      let handOn = false;
      const placeHand = () => { handOn = true; $("#hand", stage).setAttribute("opacity", "1"); hideTool("hand"); settle("S2"); };
      onDrop = () => { placeHand(); say("good", c.rules.S2.fact, "happy"); msg("Jaw supported. Now rock the tooth."); };
      let drag = false, x0 = 0, ang = 0, holdT = 0, counted = false, lastSide = "", moves = 0, jerks = 0, jerked = false, last = performance.now(), done = false;
      let hist: { t: number; a: number }[] = [];
      s.onpointerdown = (e) => {
        if (armed || done) return;
        if (!handOn) {
          if (miss("S2", hand.badEvent, whyOf("other-hand", "chest"))) { placeHand(); msg(`${msgEl.textContent} Your supervisor supports the jaw for you.`); }
          else msg("The jaw is unsupported. Drag your other hand under the jaw first.");
          return;
        }
        drag = true; x0 = e.clientX; hist = [{ t: performance.now(), a: 0 }]; jerked = false; try { s.setPointerCapture(e.pointerId); } catch { /* optional */ }
      };
      s.onpointermove = (e) => {
        if (!drag) return;
        ang = Math.max(-10, Math.min(10, (e.clientX - x0) / 5));
        const now = performance.now(); hist.push({ t: now, a: ang }); while (hist.length && now - hist[0].t > 120) hist.shift();
        if (!jerked && Math.abs(ang - hist[0].a) > 7) { jerked = true; jerks++; say(mv.badEvent, c.rules.T3.fact, "stern"); msg("Too fast. Slow, sustained pressure."); shake(); }
      };
      const up = () => { drag = false; ang = 0; holdT = 0; counted = false; };
      s.onpointerup = up; s.onpointercancel = up;
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        rk.setAttribute("transform", `rotate(${ang.toFixed(1)} 80 160)`);
        if (drag && Math.abs(ang) >= 8) {
          holdT += dt;
          if (holdT >= 0.6 && !counted) {
            counted = true; const side = ang < 0 ? "cheek" : "tongue";
            if (side === lastSide) msg("Same side twice. Take it across to the other side.");
            else { lastSide = side; moves++; msg(""); const pct = Math.round((moves / mv.movesToDecision) * 60); mb.style.width = `${pct}%`; mp.textContent = `${pct}%`; }
          }
        } else if (Math.abs(ang) < 8) { holdT = 0; counted = false; }
        hb.style.width = `${Math.min(100, (holdT / 0.6) * 100)}%`;
        if (moves >= mv.movesToDecision && !done) { done = true; drag = false; ang = 0; record(scoreStrikes(c.rules.T3, jerks, mv.strikePenalty, "Jerky movement")); later(() => go(S.i + 1), 500); return; }
        S.raf = requestAnimationFrame(tick);
      };
      S.raf = requestAnimationFrame(tick);
      hintBtn(hand.hint);
    }
  }

  function decision() {
    const st = stepOf<"decision">("resistance");
    scene("Step 5 · Clinical decision", st.title, art.jawFront());
    $("#rock", stage).classList.add("da-locked"); $("#hand", stage).setAttribute("opacity", "1");
    fx(`<text x="80" y="118" text-anchor="middle" font-family="Press Start 2P,monospace" font-size="9" fill="#ff5a5a">LOCKED</text>`);
    extra.innerHTML = `<div class="da-panel"><p>${st.prompt}</p></div>`;
    prompt("This is the moment that counts. Think before you move.", "");
    tray.innerHTML = `<div class="da-tiles" style="flex:1">${["force", "safe", "twist", "abandon"].map((id) => { const o = st.options.find((x) => x.id === id)!; return `<button type="button" class="da-tile" data-k="${id}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TILE_ICON[id]}</svg>${o.text}</button>`; }).join("")}</div>`;
    tray.querySelectorAll<HTMLElement>("[data-k]").forEach((b) => (b.onclick = () => {
      const o = st.options.find((x) => x.id === b.dataset.k)!;
      S.run.decision = o.id;
      if (!S.run.first) { S.run.first = o.id; record(scoreDecision(c.rules.D1, o)); }
      S.run.fracture = rollFracture(o, Math.random);
      go(S.i + 1);
    }));
    if (S.mode === "guided") button("Look at the radiograph again", () => openModal(`<div class="da-stage">${art.jawSide({ xray: true })}</div><p class="da-small">${c.radiograph}</p>`), "da-ghostbtn");
  }

  function outcome() {
    const R = S.run, st = stepOf<"decision">("resistance"), opt = st.options.find((o) => o.id === R.decision)!, firstOpt = st.options.find((o) => o.id === R.first)!;
    const k = R.decision!, split = k === "safe" || k === "abandon", fact = c.rules.D1.fact;
    scene("During the procedure", split ? (k === "safe" ? "Planned, and uneventful" : "Caught at the door") : R.fracture ? "Root fracture" : "Out in one piece", art.jawSide({}));
    $("#t46", stage).remove();
    const piece = (clip: string, dx: number, rot: number) => `<g class="da-piece" style="--dx:${dx}px;--dy:-150px;--rot:${rot}deg" ${clip ? `clip-path="url(#${clip}c)"` : ""}><path d="${art.T46}" fill="#f6efdc" stroke="#7a4b3a" stroke-width="3"/><path d="M128,44 L150,58 L172,44 L178,62 L150,76 L122,62Z" fill="#5b3a22"/></g>`;
    if (split) fx(piece("mes", -40, -14) + piece("dis", 40, 14) + `<path id="cut" d="M161,40 V114" stroke="#8fd8ff" stroke-width="3" stroke-dasharray="4 3"/>`);
    else if (R.fracture) fx(`<path d="M203,160 C206,168 214,172 214,176 C216,186 208,190 200,180 C196,172 196,166 203,160Z" fill="#f6efdc" stroke="#ff5a5a" stroke-width="2"/>` + piece("notip", -10, -8) + `<text x="236" y="150" font-family="Press Start 2P,monospace" font-size="9" fill="#ff5a5a">CRACK</text>`);
    else fx(piece("", 0, 6));
    later(() => stage.querySelectorAll(".da-piece").forEach((p) => p.classList.add("go")), split ? 900 : 300);
    let txt: string, chip = "";
    if (k === "safe") { txt = "Your supervisor joins you. 46 is divided between its two roots, and each root comes out along its own curve. Both root tips are complete."; say(opt.event, fact, "happy"); }
    else if (k === "abandon") { txt = "Your supervisor stops him at the door: he was about to leave with a loose, painful tooth and no plan. A senior colleague divides the tooth and removes both roots while you assist."; say(opt.event, fact, "stern"); }
    else if (R.fracture) { txt = "A crack. The crown and mesial root come away, and the curved tip of the distal root stays in the socket. Your supervisor takes over and retrieves it through a small surgical approach. The visit runs 40 minutes longer."; chip = `<span class="da-chip hit">Possible outcome · happened this run</span>`; say(opt.event, fact, "shock"); later(() => say("rootFracture", fact, "stern"), 2600); shake(); }
    else { txt = "The tooth comes out whole, both roots complete. A root fracture was a real possibility with that choice. It did not happen this time."; chip = `<span class="da-chip miss">Possible outcome · did not happen this run</span>`; say("luckyEscape", fact, "stern"); }
    extra.innerHTML = `<div class="da-panel"><p>${txt}</p>${chip}<p class="da-small">Your decision is scored on the choice, not on the luck. Chosen first: ${firstOpt.text}.</p></div>
      <div class="da-panel"><p class="da-kick">Level 2 preview · Ask the specialist</p><p class="da-small">Dr. Ada Molar is a fictional educator persona. These are scripted demo answers. No live AI is connected and nothing here is clinically reviewed.</p><div class="da-two" id="da-q"></div><p id="da-ans" style="font-size:14px"></p></div>`;
    ["Ask why", "What if?", "Another approach"].forEach((label, i) => button(label, () => { $("#da-ans", extra).textContent = SPECIALIST[i]; }, "da-ghostbtn", $<HTMLElement>("#da-q", extra)));
    button("Rewind and choose again (your first choice stays on the report)", () => { R.rewound = true; go(S.i - 1); }, "da-ghostbtn");
    nextBtn("Finish the visit");
  }

  function closeout() {
    const st = stepOf<"multi-select">("checks");
    scene("Step 6 · Before he leaves the chair", "The tooth is out. Finish the job.", art.jawSide({ socket: "bleeding" }));
    prompt("He is still in your chair and the socket is bleeding. Do what needs doing, then let him go.", "");
    setTray([{ id: "tooth", label: "The tooth", instant: true }, { id: "pinch", label: "Squeeze socket" }, { id: "gauze", label: "Gauze" }, { id: "elevator", label: "Probe deep" }]);
    zones = [{ id: "socket", x: 160, y: 118, r: 62 }];
    const did = new Set<string>();
    onDrop = (tool, z) => {
      if (tool === "tooth") {
        did.add("inspect"); hideTool("tooth");
        openModal(`<p class="da-kick">Inspect the tooth</p><div class="da-stage" style="padding:16px">${art.TOOL_ART.tooth}</div><p>${S.run.fracture ? "Crown and mesial root are here. The distal root tip was retrieved separately. Together, the tooth is complete." : S.run.decision === "force" || S.run.decision === "twist" ? "Both roots and both tips are complete." : "Two root pieces. Both tips are complete."}</p>`);
        return;
      }
      if (!z) return msg("Bring it to the socket.");
      if (tool === "pinch") { did.add("socket"); hideTool("pinch"); fx(`<path d="M112,112 h22 M208,112 h-22 M128,106 l8,6 -8,6 M192,106 l-8,6 8,6" stroke="#ffc857" stroke-width="3" fill="none" stroke-linecap="round"/>`); msg("Socket checked and its walls gently squeezed back together."); }
      else if (tool === "gauze") {
        hideTool("gauze"); fx(`<rect id="gz" x="128" y="78" width="64" height="26" rx="4" fill="#fff" stroke="#061a1c" stroke-width="2"/>`); bubble("Mmph."); msg("He is biting on the gauze…");
        extra.innerHTML = `<div class="da-bar hold"><i id="da-gb" style="transition:width 3s linear"></i></div>`; later(() => { $("#da-gb", extra).style.width = "100%"; }, 50);
        later(() => { $("#blood", stage)?.remove(); $("#gz", stage)?.remove(); did.add("haemostasis"); extra.innerHTML = ""; msg("Gauze lifted. The bleeding has stopped and a clot is forming."); }, 3200);
      } else if (tool === "elevator") { did.add("probe"); hideTool("elevator"); bubble("OW!"); say(st.badEvent, "Probing deep into a fresh socket adds trauma and tells you nothing useful.", "shock"); shake(); msg("Probing deep into a fresh socket adds trauma and tells you nothing useful."); }
    };
    hintBtn("Three things: look at what you removed, look after the socket, and make sure the bleeding has stopped before he stands up.");
    button("Discharge the patient ▶", () => {
      const sel = [...did]; if (!did.has("haemostasis")) sel.push("discharge");
      const r = scoreMultiSelect(c.rules.C1, st.options, sel, st.perCorrect, st.perHarmful); record(r); S.run.haem = did.has("haemostasis");
      const clean = r.given === 3 && r.harmful === 0;
      say(clean ? st.goodEvent : st.badEvent, c.rules.C1.fact, clean ? "happy" : "stern");
      msg(clean ? "" : st.options.filter((o) => o.correct && !sel.includes(o.id)).map((o) => `Missed: ${o.text}`).concat(!did.has("haemostasis") ? ["He left while still bleeding."] : []).join(" "));
      tray.innerHTML = ""; actions.innerHTML = ""; zones = []; onDrop = null; nextBtn();
    });
  }

  function aftercare() {
    const st = stepOf<"multi-select">("aftercare");
    scene("Step 7 · Aftercare advice", "He asks what to do at home", "", true);
    prompt("Each card is something you could tell him. Say the good advice. Bin the bad.", "");
    const said: string[] = []; let i = 0;
    const draw = () => {
      if (i >= st.options.length) return finish();
      const o = st.options[i];
      stage.innerHTML = `<div class="da-patientrow">${art.patientFace("calm")}<div class="da-pbubble">“So, doc, what do I do when I get home?”</div></div><p class="da-lab"><span>ADVICE CARD ${i + 1} OF ${st.options.length}</span><span>SWIPE OR TAP</span></p><div class="da-card" id="da-card">${o.text}<span class="tag"></span></div><div class="da-two"><button type="button" class="da-no" data-v="0">✗ Don't say it</button><button type="button" class="da-yes" data-v="1">✓ Tell him</button></div>`;
      const card = $("#da-card", stage); let x0 = 0, dx = 0, down = false, busy = false;
      const choose = (yes: boolean) => {
        if (busy) return; busy = true; if (yes) said.push(o.id);
        const tag = $(".tag", card);
        if (S.mode === "guided") { const good = yes === !!o.correct; tag.textContent = good ? (yes ? "GOOD ADVICE" : "RIGHTLY BINNED") : yes ? "HARMFUL" : "MISSED"; tag.style.color = good ? "#1c7a3a" : "#c22a2a"; }
        card.style.transform = `translateX(${yes ? 120 : -120}%) rotate(${yes ? 12 : -12}deg)`; card.style.opacity = "0";
        later(() => { i++; draw(); }, S.mode === "guided" ? 750 : 260);
      };
      card.onpointerdown = (e) => { down = true; x0 = e.clientX; card.style.transition = "none"; };
      card.onpointermove = (e) => { if (!down) return; dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; };
      const up = () => { if (!down) return; down = false; card.style.transition = ""; if (Math.abs(dx) > 70) choose(dx > 0); else card.style.transform = ""; dx = 0; };
      card.onpointerup = up; card.onpointercancel = up; card.onpointerleave = up;
      stage.querySelectorAll<HTMLElement>("[data-v]").forEach((b) => (b.onclick = () => choose(b.dataset.v === "1")));
    };
    const finish = () => {
      const r = scoreMultiSelect(c.rules.C2, st.options, said, st.perCorrect, st.perHarmful); record(r);
      S.run.missedKeys = r.missedKeys.length; S.run.harmful = r.harmful;
      const clean = r.given === st.options.filter((o) => o.correct).length && r.harmful === 0;
      stage.innerHTML = `<div class="da-patientrow">${art.patientFace(clean ? "happy" : "calm")}<div class="da-pbubble">${clean ? "“Got it. Thanks, doc.”" : "“Okay… I think I've got that.”"}</div></div><ul class="da-list">${st.options.map((o) => { const s = said.includes(o.id); const cls = s && o.correct ? "good" : s ? "harm" : o.correct ? "missed" : ""; return cls ? `<li class="${cls}"><span>${o.text}</span><em>${cls === "good" ? "SAID" : cls === "harm" ? "HARMFUL" : "MISSED"}</em></li>` : ""; }).join("")}</ul>`;
      say(clean ? st.goodEvent : st.badEvent, c.rules.C2.fact, clean ? "happy" : "stern");
      nextBtn("See what happens next");
    };
    draw();
  }

  function followup() {
    const R = S.run;
    if (!R.timeline) {
      R.outcome = rollAftermath(R.decision!, !!R.fracture, { missedKeyAdvice: R.missedKeys ?? 0, harmfulAdvice: R.harmful ?? 0, haemostasisConfirmed: !!R.haem }, Math.random);
      R.timeline = buildTimeline(R.outcome, !!R.haem);
    }
    const o = R.outcome!, T = R.timeline; let n = 0;
    const chip = (p: TimelineNode["possibility"]) => p === "happened" ? `<span class="da-chip hit">Possible outcome · happened this run</span>` : p === "did-not-happen" ? `<span class="da-chip miss">Possible outcome · did not happen this run</span>` : "";
    const sockets: art.Socket[] = [o.fracture ? "tip" : "bleeding", o.bleed ? "bleeding" : "clot", o.drySocket ? "dry" : "clot", "closing", "healed"];
    const show = () => {
      const node = T[n];
      scene(`Follow-up · ${node.when}`, node.patientReturns ? "Patient returns" : n === 0 ? "What happened to your patient" : node.when, art.jawSide({ socket: sockets[n] }));
      extra.innerHTML = `<div class="da-dots">${T.map((t, k) => `<i class="${k <= n ? "d" : ""}">${t.when.replace("During the procedure", "Visit").toUpperCase()}</i>`).join("")}</div><div class="da-panel">${node.patientReturns ? `<span class="da-ret">▶ PATIENT RETURNS</span>` : ""}<p>${node.text}</p>${chip(node.possibility)}</div>`;
      const advance = () => { if (n < T.length - 1) button("Skip ahead in time ▶", () => { n++; show(); }); else nextBtn("Learning report"); };
      if (n === 1 && o.bleed) say("bleedAtHome", c.rules.C1.fact, "stern");
      if (node.returnDecision === "dry-socket") {
        say("patientReturnsDrySocket", "Demo rule EXT-R1: a dry socket is a lost clot, treated here as a healing problem.", "shock");
        bubble("It's throbbing, doc.");
        setTray([{ id: "rx", label: "Antibiotics, go home" }, { id: "curette", label: "Scrape socket" }, { id: "saline", label: "Saline rinse" }, { id: "dressing", label: "Dressing" }]);
        zones = [{ id: "socket", x: 160, y: 130, r: 66 }];
        let wrong = 0, washed = false;
        const done = () => { R.retFirstTime = wrong === 0; tray.innerHTML = ""; zones = []; advance(); };
        onDrop = (tool, z) => {
          if (tool === "rx" || tool === "curette") {
            wrong++; hideTool(tool); shake();
            const why = tool === "rx" ? "In this demo rule set a dry socket is not an infection, so antibiotics alone do not treat it." : "In this demo rule set vigorous scraping adds trauma and pain.";
            if (tool === "curette") bubble("AAGH!");
            say("returnManagedPoorly", why, "stern"); msg(why);
            if (S.mode === "unguided") { msg(`${why} Your supervisor irrigates and dresses the socket.`); done(); }
            return;
          }
          if (!z) return msg("Bring it to the socket.");
          if (tool === "saline") { washed = true; hideTool("saline"); fx(`<path d="M150,96 q4,10 0,18 M162,94 q4,12 0,22 M172,98 q4,8 0,16" stroke="#b9ecff" stroke-width="3" fill="none" stroke-linecap="round"/>`); msg("Socket gently irrigated. Debris cleared."); }
          else if (!washed) msg("Irrigate gently first, then place the dressing.");
          else { hideTool("dressing"); fx(`<path d="M132,104 Q146,92 160,104 T188,104" stroke="#ffe08a" stroke-width="10" fill="none" stroke-linecap="round"/>`); bubble("Oh, that's better."); msg("Soothing dressing placed. Pain relief reviewed, and he will be seen again."); say("returnManagedWell", "Demo rule EXT-R1: gentle irrigation, a soothing dressing, pain relief and review.", "happy"); done(); }
        };
        hintBtn("The clot is gone and the bone is exposed. Think comfort and protection.");
      } else { if (node.patientReturns) say("healedReview", "", "happy"); advance(); }
    };
    show();
  }

  function report() {
    const R = S.run, rep = buildReport(c, [...S.results.values()], { supervisor: S.sup, mode: S.mode, outcome: R.outcome, returnVisitManagedFirstTime: R.retFirstTime });
    try { if (rep.score > best()) localStorage.setItem("da-best", String(rep.score)); } catch { /* storage is optional */ }
    const o = R.outcome!;
    scene("Learning report", c.title, `<div class="da-panel" style="flex-direction:row;align-items:center;gap:16px"><div class="da-grade">${rep.grade}</div><div><p style="font:400 14px var(--disp);color:var(--dentine)">${rep.score} / ${rep.maxScore}</p><p class="da-lead">${rep.xp} XP${R.retFirstTime ? " · includes 150 for the return visit" : ""}</p><p class="da-small">${PERSONAS[S.sup].tag} · ${S.mode === "guided" ? "Guided" : "Unguided"}${R.rewound ? " · decision rewound" : ""}</p></div></div>
      <div class="da-panel">${Object.entries(rep.domains).map(([d, v]) => `<div class="da-dom"><span>${d}</span><div class="da-bar"><i style="width:${(100 * v.points) / v.max}%"></i></div><span>${v.points}/${v.max}</span></div>`).join("")}</div>
      <div class="da-panel"><p class="da-kick">Safety-critical steps to repeat</p>${rep.safetyFlags.length ? `<ul style="padding-left:18px">${rep.safetyFlags.map((r) => `<li><strong>${r.label}.</strong> ${r.fact}</li>`).join("")}</ul>` : "<p>None. Every safety-critical step was right first time.</p>"}</div>
      <div class="da-panel"><p class="da-kick">Every scored step</p><table><thead><tr><th>Rule</th><th>Step</th><th class="n">Pts</th></tr></thead><tbody>${rep.rows.map((r) => `<tr><td>EXT-${r.rule.id}</td><td>${r.rule.label}<br><span class="da-small">${r.note}</span></td><td class="n">${r.points}/${r.rule.max}</td></tr>`).join("")}</tbody></table></div>
      <div class="da-panel"><p class="da-kick">What happened to the patient</p><p>${o.fracture ? "Root fracture, retrieved surgically. " : "No fracture. "}${o.bleed ? "Bleeding at home, settled with pressure. " : "No bleeding at home. "}${o.drySocket ? `Returned on day 3 with a dry socket${R.retFirstTime ? ", managed correctly first time." : ", management needed correcting."}` : "Routine review on day 3."}</p><p class="da-small">Complications are rolled from game odds that rise with risky choices. They are not clinical statistics, and a mistake does not always cause harm.</p></div>
      <div class="da-panel"><p class="da-kick">Share your result</p><textarea rows="4" readonly aria-label="Shareable result" id="da-share">${rep.shareText}</textarea><p class="da-small">No patient details are included.</p></div>
      <p class="da-small">${MOTOR_SKILL_DISCLAIMER} The rules in this demo have not been reviewed by a clinician.</p>`, true);
    say(closingEvent(rep.score), "", rep.score >= 85 ? "happy" : rep.score >= 55 ? "neutral" : "stern");
    const cp = button("COPY RESULT", () => { try { navigator.clipboard.writeText(rep.shareText).then(() => { cp.textContent = "COPIED"; }, () => $<HTMLTextAreaElement>("#da-share", stage).select()); } catch { $<HTMLTextAreaElement>("#da-share", stage).select(); } }, "da-ghostbtn");
    button("PLAY AGAIN ▶", () => go(1));
  }

  const SCENES = [title, setup, brief, site, inject, testNumb, elevate, deliver, decision, outcome, closeout, aftercare, followup, report];

  $("[data-act=sup]").onclick = () => {
    openModal(`<p class="da-kick">Switch at any time</p><h2>Supervisor</h2><div class="da-opts">${SUPERVISOR_ORDER.map((k) => `<button type="button" class="da-opt${S.sup === k ? " sel" : ""}" data-k="${k}">${art.supervisorFace(PERSONAS[k].colour, k, "neutral")}<span><strong>${PERSONAS[k].tag}</strong><br>${PERSONAS[k].blurb}</span></button>`).join("")}</div><label class="da-check"><input type="checkbox" id="da-v2"${S.voice ? " checked" : ""}><span>Read lines aloud</span></label>`);
    modalIn.querySelectorAll<HTMLElement>("[data-k]").forEach((b) => (b.onclick = () => { S.sup = b.dataset.k as SupervisorId; modal.classList.remove("on"); if (S.last) say(S.last.e, S.last.f, S.last.x, S.last.line && S.sup !== "osce" ? S.last.line : undefined); }));
    $<HTMLInputElement>("#da-v2", modalIn).onchange = (e) => { S.voice = (e.target as HTMLInputElement).checked; if (!S.voice) { try { speechSynthesis.cancel(); } catch { /* optional */ } } };
  };

  go(0);
  return () => { cancelAnimationFrame(S.raf); S.timers.forEach(clearTimeout); document.querySelectorAll(".da-ghost").forEach((g) => g.remove()); root.innerHTML = ""; };
}
