import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGUE, catalogueCounts } from "@/content/catalogue";

export const metadata: Metadata = { title: "Curriculum" };

export default function CurriculumPage() {
  const c = catalogueCounts();
  return (
    <div className="flex flex-col gap-4">
      <p className="kicker">Specialty → procedure</p>
      <h1 className="text-2xl font-bold">Curriculum map</h1>
      <p className="text-mute">
        {c.procedures} procedures across {c.specialties} areas. {c.demo} is a playable demo and {c.published} are clinician-approved.
        Every other entry is planned and has no content yet.
      </p>
      {CATALOGUE.map((s) => (
        <section key={s.slug} id={s.slug} className="panel" aria-labelledby={`h-${s.slug}`}>
          <h2 id={`h-${s.slug}`} className="font-bold text-xray">{s.name} <span className="font-medium text-mute">· {s.procedures.length}</span></h2>
          <ul className="flex flex-wrap gap-1.5">
            {s.procedures.map((p) =>
              p.status === "planned" ? (
                <li key={p.slug} className="rounded-sm border border-line px-1.5 py-0.5 text-xs text-mute">{p.name}</li>
              ) : (
                <li key={p.slug}>
                  <Link href={`/play/${p.slug}`} className="block rounded-sm border border-dentine px-1.5 py-0.5 text-xs text-dentine">
                    {p.name} · {p.status === "demo" ? "playable demo" : "play"}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
