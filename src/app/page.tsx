import Link from "next/link";
import { catalogueCounts } from "@/content/catalogue";
import { PERSONAS, SUPERVISOR_ORDER } from "@/engines/supervisor";

export default function Home() {
  const c = catalogueCounts();
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <p className="kicker">Simulation 001 · Oral surgery</p>
        <h1 className="font-display text-2xl leading-snug [text-shadow:3px_3px_0_var(--color-gingiva),-2px_-2px_0_rgba(143,216,255,.6)]">
          CAN YOU TAKE OUT TOOTH 46?
        </h1>
        <p className="font-semibold text-dentine">Practice like a student. Think like a specialist.</p>
        <p className="text-mute">One synthetic patient. Ten hands-on steps. One moment where the tooth stops moving and the next move is yours.</p>
        <Link href="/play/simple-extraction" className="btn-primary text-center">START ▶</Link>
      </section>
      <section className="panel" aria-labelledby="sup-h">
        <h2 id="sup-h" className="kicker">Choose who watches you work</h2>
        <ul className="grid grid-cols-2 gap-2">
          {SUPERVISOR_ORDER.map((id) => (
            <li key={id} className="rounded-lg border-2 border-line p-2" style={{ borderLeftColor: PERSONAS[id].colour, borderLeftWidth: 6 }}>
              <p className="font-bold">{PERSONAS[id].tag}</p>
              <p className="text-sm text-mute">{PERSONAS[id].blurb}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-mute">Four voices, one set of clinical rules. Tone never changes the facts.</p>
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Link href="/curriculum" className="panel hover:border-xray">
          <span className="font-display text-xl text-dentine">{c.procedures}</span>
          <span className="text-sm text-mute">procedures mapped across {c.specialties} areas. {c.demo} playable so far.</span>
        </Link>
        <Link href="/status" className="panel hover:border-xray">
          <span className="font-display text-xl text-dentine">PHASE 1</span>
          <span className="text-sm text-mute">See exactly what is built and what is not.</span>
        </Link>
      </section>
    </div>
  );
}
