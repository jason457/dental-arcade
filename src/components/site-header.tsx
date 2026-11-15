import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/supabase/server";

async function UserLink() {
  const user = await getCurrentUser();
  return <Link href={user ? "/account" : "/login"} className="text-xray">{user ? (user.displayName ?? "Account") : "Sign in"}</Link>;
}

export function SiteHeader() {
  return (
    <header className="flex flex-col gap-2 pt-4 pb-2">
      <div className="flex items-baseline justify-between gap-3">
        <Link href="/" className="marquee">DENTAL ARCADE</Link>
        <Suspense fallback={<span className="text-mute">…</span>}><UserLink /></Suspense>
      </div>
      <p className="self-start rounded-sm bg-dentine px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-drape">
        Demo · not clinically approved · synthetic patients
      </p>
      <nav aria-label="Main" className="flex gap-4 text-sm font-semibold text-mute">
        <Link href="/play/simple-extraction" className="hover:text-enamel">Play</Link>
        <Link href="/curriculum" className="hover:text-enamel">Curriculum</Link>
        <Link href="/status" className="hover:text-enamel">Build status</Link>
      </nav>
    </header>
  );
}
