/**
 * Illustrations for the extraction game. All drawings are stylised teaching diagrams, drawn as SVG
 * so they stay sharp on any screen. Coordinates here are shared with the drop zones in game.ts.
 */
const INK = "#061a1c", ENAMEL = "#f6efdc", GUM = "#ff8f9a", BONE = "#d6b481", GAP = "#7a4b3a", DECAY = "#5b3a22";
const FONT = 'font-family="Chakra Petch,sans-serif" font-weight="700"';

export const T45 = "M44,95 C40,70 46,48 64,46 C82,48 88,70 84,95 C82,130 74,165 66,186 C62,192 56,190 56,182 C52,150 46,120 44,95 Z";
export const T46 = "M114,95 C108,72 112,50 128,44 L150,58 L172,44 C196,40 210,62 206,95 C204,125 206,150 214,172 C218,184 208,190 200,180 C190,160 182,135 176,118 C170,108 152,108 146,118 C144,140 140,165 134,184 C130,192 120,190 120,180 C118,150 116,120 114,95 Z";
export const T47 = "M232,95 C226,70 232,48 256,44 C284,42 300,60 298,95 C296,125 296,150 290,176 C288,186 278,186 276,176 C272,150 268,128 262,118 C256,110 250,112 248,120 C246,145 246,165 242,180 C240,188 232,186 232,178 C232,150 234,120 232,95 Z";
const CREST = "M0,100 Q25,93 50,98 T100,98 T160,99 T220,98 T320,98";

/** FDI numbers left to right as the operator sees a lower arch: patient's right is on the left. */
export const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export function archPoint(i: number) {
  const t = (i - 7.5) / 7.5;
  const unit = LOWER[i] % 10;
  return { x: 180 + t * 118, y: 70 + (1 - t * t) * 150, r: unit >= 6 ? 13 : unit >= 4 ? 10 : 7.6 };
}
export const toothPoint = (n: number) => archPoint(LOWER.indexOf(n));

/** Open mouth, looking down on the lower arch. viewBox 360×300. */
export function mouth(opts: { numbers?: boolean } = {}) {
  let s = `<svg viewBox="0 0 360 300" class="da-svg" role="img" aria-label="Open mouth showing the lower teeth. The patient's right is on your left.">`;
  s += `<rect width="360" height="300" fill="#c9485b"/><ellipse cx="180" cy="150" rx="166" ry="141" fill="#4a121d"/>`;
  s += `<ellipse cx="180" cy="22" rx="60" ry="26" fill="#2a070d"/><path d="M180,2 q-9,26 0,40 q9,-14 0,-40" fill="#b5374a"/>`;
  s += `<path d="M62,70 Q180,370 298,70" fill="none" stroke="${GUM}" stroke-width="46" stroke-linecap="round"/>`;
  s += `<ellipse cx="180" cy="118" rx="52" ry="80" fill="#e8707c"/><path d="M180,50 V180" stroke="#c9566a" stroke-width="3" stroke-linecap="round"/>`;
  s += `<g id="teeth">`;
  LOWER.forEach((n, i) => {
    const p = archPoint(i);
    const decay = n === 46 ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="${DECAY}"/>` : "";
    s += `<g class="da-tooth" data-n="${n}" tabindex="0" role="button" aria-label="Tooth ${n}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="${ENAMEL}" stroke="${INK}" stroke-width="2"/>${decay}`;
    if (opts.numbers) s += `<text x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="middle" ${FONT} font-size="8.5" fill="${n === 46 ? ENAMEL : "#0a2a2e"}" pointer-events="none">${n}</text>`;
    s += `</g>`;
  });
  s += `</g><g ${FONT} font-size="10" fill="#ffd9de"><text x="10" y="292">PATIENT RIGHT</text><text x="350" y="292" text-anchor="end">PATIENT LEFT</text></g>`;
  return s + `<g id="fx"></g><g id="zones"></g></svg>`;
}

export type Socket = "tooth" | "bleeding" | "clot" | "dry" | "tip" | "closing" | "healed";
/** Side view of 45, 46 and 47 in bone. viewBox 320×220. */
export function jawSide(o: { socket?: Socket; pdl?: boolean; xray?: boolean; marks?: boolean } = {}) {
  const x = !!o.xray, sock = o.socket ?? "tooth";
  const bone = x ? "#59636b" : BONE, bg = x ? "#07090b" : INK, tooth = x ? "#d9dfe4" : ENAMEL, gap = x ? "#1b2126" : GAP, car = x ? "#1b2126" : DECAY;
  const id = x ? "x" : "c";
  let s = `<svg viewBox="0 0 320 220" class="da-svg" role="img" aria-label="${x ? "Stylised radiograph of teeth 45, 46 and 47" : "Side view of teeth 45, 46 and 47 in the jaw bone"}">`;
  s += `<defs><clipPath id="below${id}"><rect x="0" y="97" width="320" height="130"/></clipPath><clipPath id="mes${id}"><rect x="90" y="0" width="71" height="220"/></clipPath><clipPath id="dis${id}"><rect x="161" y="0" width="80" height="220"/></clipPath><clipPath id="notip${id}"><path d="M90,0 H240 V150 L196,160 L192,220 H90Z"/></clipPath></defs>`;
  s += `<rect width="320" height="220" fill="${bg}"/><path d="${CREST} V220 H0Z" fill="${bone}"/>`;
  if (x) s += `<path d="M0,206 C80,198 240,214 320,202" stroke="#3a434a" stroke-width="10" fill="none"/><ellipse cx="127" cy="188" rx="11" ry="9" fill="#262d33"/>`;
  else s += `<path d="${CREST} V88 Q160,80 0,88Z" fill="${GUM}"/>`;
  s += `<path d="${T45}" fill="${tooth}" stroke="${gap}" stroke-width="3"/><path d="${T47}" fill="${tooth}" stroke="${gap}" stroke-width="3"/>`;
  if (sock !== "healed") {
    const fill = sock === "dry" ? "#efe3c8" : sock === "closing" ? "#c79f6c" : sock === "tooth" ? (x ? "#1b2126" : "#4a1a22") : "#7a1f2b";
    s += `<g id="socket"><path d="${T46}" fill="${fill}" ${sock === "dry" ? `stroke="#b9a37a" stroke-width="2"` : ""} clip-path="url(#below${id})"/></g>`;
  }
  if (sock === "tip") s += `<path id="tip" d="M203,160 C206,168 214,172 214,176 C216,186 208,190 200,180 C196,172 196,166 203,160Z" fill="${tooth}" stroke="#ff5a5a" stroke-width="2"/>`;
  if (sock === "bleeding") s += `<ellipse id="blood" cx="160" cy="100" rx="44" ry="9" fill="#e0263c"><animate attributeName="ry" values="8;11;8" dur="1.2s" repeatCount="indefinite"/></ellipse>`;
  if (sock === "closing" || sock === "healed") s += `<path d="M104,99 Q160,${sock === "healed" ? 86 : 104} 216,99 V90 Q160,${sock === "healed" ? 78 : 96} 104,90Z" fill="${GUM}"/>`;
  if (sock === "tooth") {
    s += `<g id="t46"><path id="t46body" d="${T46}" fill="${tooth}" stroke="${gap}" stroke-width="3"/>`;
    if (o.pdl) s += `<path id="pdl" d="${T46}" fill="none" stroke="#ff6f7d" stroke-width="5" stroke-dasharray="2 5" clip-path="url(#below${id})"/>`;
    s += `<path id="decay" d="M128,44 L150,58 L172,44 L178,62 L150,76 L122,62Z" fill="${car}"/>`;
    if (x) s += `<ellipse cx="160" cy="88" rx="24" ry="7" fill="#8d979e"/><path d="M146,96 C142,130 138,160 130,182 M176,96 C182,130 196,160 206,176" stroke="#8d979e" stroke-width="3" fill="none"/>`;
    s += `</g>`;
  }
  s += `<g ${FONT} font-size="11" fill="${x ? "#aeb8bf" : "#0a2a2e"}" text-anchor="middle"><text x="64" y="${x ? 30 : 72}">45</text><text x="266" y="${x ? 30 : 72}">47</text><text x="160" y="30" fill="${x ? "#aeb8bf" : ENAMEL}">46</text></g>`;
  return s + `<g id="fx"></g><g id="zones"></g></svg>`;
}

/** Tooth 46 seen from the front, cheek on the left and tongue on the right. viewBox 160×180. */
export function jawFront() {
  return `<svg viewBox="0 0 160 180" class="da-svg" role="img" aria-label="Tooth 46 from the front, held in forceps, between cheek side and tongue side">
  <rect width="160" height="180" fill="${INK}"/>
  <path d="M0,84 Q26,72 52,76 C56,120 66,160 80,166 C94,160 104,120 108,76 Q134,72 160,84 V180 H0Z" fill="${BONE}"/>
  <path d="M0,84 Q26,72 52,76 L54,88 Q28,83 0,96Z M160,84 Q134,72 108,76 L106,88 Q132,83 160,96Z" fill="${GUM}"/>
  <g id="hand" opacity="0"><path d="M22,176 Q30,150 60,148 H100 Q130,150 138,176Z" fill="#8fd8ff" stroke="${INK}" stroke-width="2"/><text x="80" y="170" text-anchor="middle" ${FONT} font-size="8" fill="${INK}">YOUR OTHER HAND</text></g>
  <g id="rock">
    <path d="M54,74 C48,50 54,32 80,30 C106,32 112,50 106,74 C102,115 94,150 80,160 C66,150 58,115 54,74Z" fill="${ENAMEL}" stroke="${GAP}" stroke-width="3"/>
    <path d="M66,32 L80,42 L94,32 L96,44 L80,54 L64,44Z" fill="${DECAY}"/>
    <g id="forceps" stroke="#c9d6d8" stroke-linecap="round" fill="none"><path d="M58,82 C46,60 50,34 66,6" stroke-width="7"/><path d="M102,82 C114,60 110,34 94,6" stroke-width="7"/><path d="M58,82 l6,6 M102,82 l-6,6" stroke-width="5"/></g>
  </g>
  <g ${FONT} font-size="7" fill="#a5c4c0"><text x="3" y="64">CHEEK</text><text x="157" y="64" text-anchor="end">TONGUE</text></g>
  <g id="fx"></g></svg>`;
}

const tool = (body: string, w = 120, h = 44) => `<svg viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const handle = (x: number, w: number, c = "#9fb4b8") => `<rect x="${x}" y="15" width="${w}" height="14" rx="6" fill="${c}" stroke="${INK}" stroke-width="2"/>` + [0.25, 0.4, 0.55, 0.7].map((f) => `<path d="M${x + w * f},18 v8" stroke="${INK}" stroke-width="1.5"/>`).join("");
const forceps = (beaks: string) => tool(`<path d="M6,10 C40,14 60,18 78,22" stroke="#c9d6d8" stroke-width="7"/><path d="M6,34 C40,30 60,26 78,22" stroke="#c9d6d8" stroke-width="7"/><circle cx="78" cy="22" r="4.5" fill="${INK}" stroke="#c9d6d8" stroke-width="2"/>${beaks}`);
export const TOOL_ART: Record<string, string> = {
  syringe: tool(`<rect x="34" y="14" width="50" height="16" rx="3" fill="#dff3ff" stroke="${INK}" stroke-width="2"/><rect x="40" y="18" width="30" height="8" fill="#8fd8ff"/><path d="M34,22 H14 M14,12 V32" stroke="#c9d6d8" stroke-width="4"/><path d="M84,22 H96" stroke="#c9d6d8" stroke-width="5"/><path d="M96,22 H116" stroke="#e8f1f2" stroke-width="1.6"/>`),
  probe: tool(`${handle(8, 64)}<path d="M72,22 H98 Q110,22 112,34" stroke="#e8f1f2" stroke-width="2.4"/>`),
  elevator: tool(`${handle(6, 52, "#7fa0a6")}<path d="M58,22 H92" stroke="#c9d6d8" stroke-width="5"/><path d="M92,16 Q112,18 116,22 Q112,26 92,28Z" fill="#e8f1f2" stroke="${INK}" stroke-width="1.5"/>`),
  scaler: tool(`${handle(8, 60)}<path d="M68,22 H96 Q112,20 108,8" stroke="#e8f1f2" stroke-width="2.6"/>`),
  handpiece: tool(`<rect x="6" y="14" width="74" height="16" rx="7" fill="#9fb4b8" stroke="${INK}" stroke-width="2"/><path d="M80,22 L100,16" stroke="#9fb4b8" stroke-width="12"/><circle cx="104" cy="16" r="8" fill="#c9d6d8" stroke="${INK}" stroke-width="2"/><path d="M104,24 V40" stroke="#e8f1f2" stroke-width="2.4"/>`),
  "forceps-lower": forceps(`<path d="M78,22 H96 Q104,22 104,40 M78,22 H90 Q96,24 96,40" stroke="#e8f1f2" stroke-width="4"/>`),
  "forceps-upper": forceps(`<path d="M78,22 L114,16 M78,22 L114,28" stroke="#e8f1f2" stroke-width="4"/>`),
  "forceps-bayonet": forceps(`<path d="M78,22 L90,10 H116 M78,22 L92,16 H116" stroke="#e8f1f2" stroke-width="4"/>`),
  hand: tool(`<path d="M20,36 Q24,14 44,12 H84 Q104,14 104,36Z" fill="#8fd8ff" stroke="${INK}" stroke-width="2"/><path d="M40,12 V4 M54,12 V2 M68,12 V2 M82,12 V5" stroke="#8fd8ff" stroke-width="9"/>`),
  tooth: tool(`<path d="M42,8 C36,4 62,2 60,10 C70,2 86,6 80,14 C78,24 82,34 78,40 C74,44 70,30 62,24 C56,24 54,36 48,40 C42,42 44,22 42,8Z" fill="${ENAMEL}" stroke="${GAP}" stroke-width="2"/>`),
  gauze: tool(`<rect x="38" y="4" width="44" height="36" rx="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/><path d="M38,16 H82 M38,28 H82 M52,4 V40 M68,4 V40" stroke="#c9d6d8" stroke-width="1.5"/>`),
  pinch: tool(`<path d="M34,6 Q54,10 56,22 M86,6 Q66,10 64,22" stroke="#ffd2b0" stroke-width="11"/><path d="M48,36 L58,26 M72,36 L62,26" stroke="#ffc857" stroke-width="3"/>`),
  saline: tool(`<rect x="34" y="14" width="50" height="16" rx="3" fill="#e9fbff" stroke="${INK}" stroke-width="2"/><rect x="40" y="18" width="36" height="8" fill="#b9ecff"/><path d="M34,22 H14 M14,12 V32" stroke="#c9d6d8" stroke-width="4"/><path d="M84,22 H104 Q112,22 112,30" stroke="#e8f1f2" stroke-width="3"/>`),
  dressing: tool(`<path d="M20,22 Q36,6 52,22 T84,22 T104,18" stroke="#ffe08a" stroke-width="9"/><path d="M20,22 Q36,6 52,22 T84,22 T104,18" stroke="#c99a2e" stroke-width="1.5" stroke-dasharray="3 4"/>`),
  curette: tool(`${handle(8, 60)}<path d="M68,22 H98" stroke="#e8f1f2" stroke-width="3"/><ellipse cx="106" cy="22" rx="8" ry="5" fill="none" stroke="#e8f1f2" stroke-width="2.6"/>`),
  rx: tool(`<rect x="40" y="3" width="40" height="38" rx="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/><text x="60" y="22" text-anchor="middle" ${FONT} font-size="14" fill="${INK}">Rx</text><path d="M48,30 H72 M48,35 H64" stroke="#9fb4b8" stroke-width="2"/>`),
};

export function patientFace(mood: "calm" | "ouch" | "happy") {
  const mouthPath = mood === "ouch" ? `<ellipse cx="50" cy="66" rx="9" ry="11" fill="${INK}"/>` : `<path d="M36,${mood === "happy" ? 62 : 66} Q50,${mood === "happy" ? 76 : 68} 64,${mood === "happy" ? 62 : 66}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" class="da-patient" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#f2c6a0" stroke="${INK}" stroke-width="3"/><path d="M12,36 Q50,-8 88,36 Q70,20 50,20 Q30,20 12,36Z" fill="#6b6b6b"/><circle cx="35" cy="44" r="4" fill="${INK}"/><circle cx="65" cy="44" r="4" fill="${INK}"/>${mood === "ouch" ? `<path d="M27,34 L41,39 M73,34 L59,39" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : ""}${mouthPath}<rect x="14" y="58" width="16" height="13" rx="3" fill="#fff" stroke="${INK}" stroke-width="1.5"/></svg>`;
}

export function supervisorFace(colour: string, id: string, expr: "neutral" | "happy" | "stern" | "shock") {
  const k = "#0a2a2e";
  const m = { neutral: "M22,45 H42", happy: "M20,42 Q32,53 44,42", stern: "M21,47 Q32,40 43,47", shock: "M27,41 h10 v9 h-10 Z" }[expr];
  const brow = expr === "stern" ? "M16,19 L28,24 M48,19 L36,24" : expr === "shock" ? "M17,16 H27 M37,16 H47" : "M17,21 H27 M37,21 H47";
  const acc: Record<string, string> = {
    mentor: `<circle cx="16" cy="38" r="4" fill="#ff6f7d" opacity=".6"/><circle cx="48" cy="38" r="4" fill="#ff6f7d" opacity=".6"/>`,
    strict: `<rect x="16" y="24" width="14" height="12" rx="2" fill="none" stroke="${k}" stroke-width="2"/><rect x="34" y="24" width="14" height="12" rx="2" fill="none" stroke="${k}" stroke-width="2"/>`,
    roast: `<path d="M22,9 Q26,-2 31,5 Q36,-4 42,9Z" fill="#ffc857"/>`,
    osce: `<rect x="42" y="42" width="16" height="18" rx="2" fill="#f6efdc" stroke="${k}" stroke-width="2"/><path d="M46,48h8M46,53h8" stroke="${k}" stroke-width="1.5"/>`,
  };
  return `<svg class="da-face" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="48" height="48" rx="10" fill="${colour}"/><path d="${brow}" stroke="${k}" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="30" r="3.5" fill="${k}"/><circle cx="41" cy="30" r="3.5" fill="${k}"/><path d="${m}" stroke="${k}" stroke-width="3" fill="${expr === "shock" ? k : "none"}" stroke-linecap="round"/>${acc[id] ?? ""}</svg>`;
}
