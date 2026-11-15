import type { Metadata } from "next";
import { STATE_LABEL, STATUS, type BuildState } from "@/content/status";

export const metadata: Metadata = { title: "Build status" };
const colour: Record<BuildState, string> = { working: "text-ok", demo: "text-dentine", foundation: "text-xray", "not-built": "text-mute" };

export default function StatusPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="kicker">Honest status</p>
      <h1 className="text-2xl font-bold">What is built</h1>
      <p className="text-mute">Foundation means the rules and data structures exist and are tested, with no screens on top yet.</p>
      <ul className="flex flex-col gap-2">
        {STATUS.map((r) => (
          <li key={r.module} className="panel">
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold">{r.module}</span>
              <span className={`chip shrink-0 ${colour[r.state]}`}>{STATE_LABEL[r.state]}</span>
            </div>
            <p className="text-sm text-mute">Phase {r.phase}{r.detail ? `. ${r.detail}` : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
