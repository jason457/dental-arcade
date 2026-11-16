/**
 * Original chiptune music and sound effects, synthesised live with the Web Audio API.
 * No audio files: nothing to download, nothing licensed. Browsers only allow sound after a
 * tap, so start() must be called from a click handler.
 */
export type Track = "calm" | "tense" | "win" | "none";
export type Sfx = "good" | "bad" | "ouch" | "pick" | "drop" | "crack" | "pop" | "fanfare" | "tick";

const NOTE = (n: string) => {
  const m = /^([A-G])(#?)(\d)$/.exec(n)!;
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as "C"]! + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
};
/** A pattern line: 16 steps, "." is a rest, "-" holds the previous note. */
const line = (s: string) => s.trim().split(/\s+/);

interface Pattern { bpm: number; bars: { lead: string[]; bass: string[]; hat?: string; kick?: string }[]; leadWave: OscillatorType; leadVol: number }
const SONGS: Record<Exclude<Track, "none">, Pattern> = {
  // Operatory: bright, unhurried, C major with a lilting arpeggio.
  calm: {
    bpm: 104, leadWave: "square", leadVol: 0.045,
    bars: [
      { lead: line("E5 . G5 . C6 . G5 . E5 . G5 . D5 - . ."), bass: line("C3 . . . G2 . . . C3 . . . G2 . . ."), hat: "x.x.x.x.x.x.x.x." },
      { lead: line("F5 . A5 . C6 . A5 . F5 . A5 . G5 - . ."), bass: line("F2 . . . C3 . . . F2 . . . C3 . . ."), hat: "x.x.x.x.x.x.x.x." },
      { lead: line("E5 . G5 . C6 . E6 . D6 . C6 . A5 - . ."), bass: line("A2 . . . E3 . . . A2 . . . E3 . . ."), hat: "x.x.x.x.x.x.x.x." },
      { lead: line("G5 . F5 . E5 . D5 . E5 - - - . . . ."), bass: line("G2 . . . D3 . . . G2 . . . B2 . . ."), hat: "x.x.x.x.x.xxx.x." },
    ],
  },
  // The tooth locks: A minor, low pulse, a heartbeat kick.
  tense: {
    bpm: 84, leadWave: "triangle", leadVol: 0.07,
    bars: [
      { lead: line("A4 . . . . . C5 . . . B4 . . . . ."), bass: line("A1 A1 . . A1 A1 . . A1 A1 . . A1 A1 . ."), kick: "x..x....x..x...." },
      { lead: line("A4 . . . . . E5 . . . D5 . C5 . . ."), bass: line("F1 F1 . . F1 F1 . . F1 F1 . . F1 F1 . ."), kick: "x..x....x..x...." },
      { lead: line("G4 . . . . . B4 . . . A4 . . . . ."), bass: line("G1 G1 . . G1 G1 . . G1 G1 . . G1 G1 . ."), kick: "x..x....x..x...." },
      { lead: line("E4 . . . G#4 . . . B4 . . . E5 . . ."), bass: line("E1 E1 . . E1 E1 . . E1 E1 . . E1 E1 . ."), kick: "x..x....x..x...." },
    ],
  },
  // Learning report: quick, triumphant loop.
  win: {
    bpm: 132, leadWave: "square", leadVol: 0.05,
    bars: [
      { lead: line("C5 E5 G5 C6 . G5 C6 . E6 . D6 . C6 . . ."), bass: line("C3 . C3 . G2 . G2 . C3 . C3 . G2 . G2 ."), hat: "x.x.x.x.x.x.x.x.", kick: "x...x...x...x..." },
      { lead: line("A5 . G5 . F5 . E5 . D5 . E5 . F5 . . ."), bass: line("F2 . F2 . C3 . C3 . G2 . G2 . D3 . D3 ."), hat: "x.x.x.x.x.x.x.x.", kick: "x...x...x...x..." },
      { lead: line("E5 G5 C6 . G5 C6 E6 . G6 . E6 . D6 . C6 ."), bass: line("A2 . A2 . E3 . E3 . F2 . F2 . G2 . G2 ."), hat: "x.x.x.x.x.x.x.x.", kick: "x...x...x...x..." },
      { lead: line("D6 . . . B5 . G5 . C6 - - - . . . ."), bass: line("G2 . G2 . G2 . B2 . C3 . . . C3 . . ."), hat: "x.x.x.x.xxxxx.x.", kick: "x...x...x.x.x..." },
    ],
  },
};

export class Chiptune {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private track: Track = "none";
  private step = 0;
  private nextTime = 0;
  private lastLead = 0;
  muted: boolean;

  constructor() {
    let m = false;
    try { m = localStorage.getItem("da-mute") === "1"; } catch { /* storage optional */ }
    this.muted = m;
  }
  /** Call from a tap or click. Safe to call more than once. */
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.8; this.musicBus.connect(this.master);
    const len = this.ctx.sampleRate * 0.5, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }
  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem("da-mute", m ? "1" : "0"); } catch { /* storage optional */ }
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }
  play(track: Track) {
    if (track === this.track) return;
    this.track = track; this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.08;
  }
  stop() {
    window.clearInterval(this.timer);
    void this.ctx?.close();
    this.ctx = null;
  }

  private tone(freq: number, at: number, dur: number, wave: OscillatorType, vol: number, dest: AudioNode, slideTo?: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest); o.start(at); o.stop(at + dur + 0.02);
  }
  private hiss(at: number, dur: number, vol: number, dest: AudioNode, hp = 6000) {
    const ctx = this.ctx!, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise; f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(at); s.stop(at + dur + 0.02);
  }
  private schedule() {
    const ctx = this.ctx; if (!ctx || this.track === "none") return;
    const song = SONGS[this.track], spb = 60 / song.bpm / 4;
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const bar = song.bars[Math.floor(this.step / 16) % song.bars.length], i = this.step % 16, t = this.nextTime, bus = this.musicBus!;
      const ln = bar.lead[i];
      if (ln && ln !== "." && ln !== "-") {
        let held = 1; while (bar.lead[i + held] === "-") held++;
        this.lastLead = NOTE(ln);
        this.tone(this.lastLead, t, spb * held * 0.95, song.leadWave, song.leadVol, bus);
      }
      const bn = bar.bass[i];
      if (bn && bn !== "." && bn !== "-") this.tone(NOTE(bn), t, spb * 1.6, "triangle", 0.11, bus);
      if (bar.hat?.[i] === "x") this.hiss(t, 0.035, 0.03, bus);
      if (bar.kick?.[i] === "x") this.tone(140, t, 0.14, "sine", 0.22, bus, 45);
      this.nextTime += spb; this.step++;
    }
  }

  sfx(kind: Sfx) {
    const ctx = this.ctx, m = this.master; if (!ctx || !m) return;
    const t = ctx.currentTime + 0.01;
    switch (kind) {
      case "good": this.tone(NOTE("E6"), t, 0.09, "square", 0.08, m); this.tone(NOTE("B6"), t + 0.08, 0.16, "square", 0.08, m); break;
      case "bad": this.tone(160, t, 0.22, "sawtooth", 0.07, m, 90); this.tone(150, t + 0.02, 0.22, "square", 0.04, m, 80); break;
      case "ouch": this.tone(700, t, 0.25, "square", 0.06, m, 260); this.hiss(t, 0.12, 0.05, m, 1500); break;
      case "pick": this.tone(NOTE("C6"), t, 0.05, "square", 0.04, m, NOTE("G6")); break;
      case "drop": this.tone(NOTE("G5"), t, 0.06, "triangle", 0.09, m); this.hiss(t, 0.04, 0.04, m, 3000); break;
      case "tick": this.tone(1800, t, 0.02, "square", 0.025, m); break;
      case "crack": this.hiss(t, 0.18, 0.25, m, 900); this.tone(90, t, 0.2, "square", 0.08, m, 40); break;
      case "pop": this.tone(NOTE("C5"), t, 0.12, "square", 0.06, m, NOTE("C7")); break;
      case "fanfare":
        ["C5", "E5", "G5", "C6"].forEach((n, k) => this.tone(NOTE(n), t + k * 0.09, 0.12, "square", 0.07, m));
        this.tone(NOTE("E6"), t + 0.36, 0.45, "square", 0.07, m); this.tone(NOTE("C4"), t + 0.36, 0.45, "triangle", 0.12, m);
        break;
    }
  }
}
