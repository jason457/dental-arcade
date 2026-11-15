import type { Metadata } from "next";
import { getCase, maxScore } from "@/engines/case";

export const metadata: Metadata = { title: "Simple extraction" };

export default function PlaySimpleExtraction() {
  const c = getCase("simple-extraction-46")!;
  return (
    <div className="flex flex-col gap-4">
      <p className="kicker">Case {c.id} · Level {c.level}</p>
      <h1 className="text-2xl font-bold">{c.title}</h1>
      <dl className="panel grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-mute">Patient</dt><dd>{c.patient.label}, {c.patient.age}, {c.patient.sex}</dd>
        <dt className="text-mute">Complaint</dt><dd>{c.complaint}</dd>
        <dt className="text-mute">Steps</dt><dd>{c.steps.length} scored steps, {maxScore(c)} points</dd>
        <dt className="text-mute">Review</dt><dd className="text-dentine">Demo. Not reviewed by a clinician.</dd>
      </dl>
      {/* Phase 1 serves the standalone demo build. Phase 2 replaces this with the engine-driven React player. */}
      <a href="/demo/simple-extraction.html" className="btn-primary text-center">PLAY THE DEMO ▶</a>
      <p className="text-sm text-mute">
        The playable game on the next screen is the standalone demo build. Its rules match the case data in this
        app, but it does not save progress to an account yet.
      </p>
    </div>
  );
}
