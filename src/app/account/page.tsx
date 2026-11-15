import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { levelForXp } from "@/engines/analytics";
import { FREE_LEVEL1_PICKS } from "@/engines/commerce";
import { getCurrentUser } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Account" };

async function AccountPanel() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="panel">
        <p>You are not signed in.</p>
        <Link href="/login" className="btn-primary text-center">Sign in ▶</Link>
      </div>
    );
  }
  return (
    <>
      <dl className="panel grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-mute">Player</dt><dd>{user.displayName ?? user.email}</dd>
        <dt className="text-mute">Plan</dt><dd className="capitalize">{user.plan}</dd>
        <dt className="text-mute">Level</dt><dd>{levelForXp(user.xp)} · {user.xp} XP</dd>
        <dt className="text-mute">Free picks</dt><dd>{FREE_LEVEL1_PICKS} Level 1 procedures</dd>
        <dt className="text-mute">Referral code</dt><dd className="font-mono">{user.referralCode ?? "—"}</dd>
      </dl>
      <p className="text-sm text-mute">Saved attempts, referral rewards and subscriptions arrive in later phases. See the build status page.</p>
      <form action={signOut}><button type="submit" className="btn-ghost w-full">Sign out</button></form>
    </>
  );
}

export default function AccountPage() {
  return (
    <section className="flex flex-col gap-4">
      <p className="kicker">Player account</p>
      <h1 className="text-2xl font-bold">Your account</h1>
      <Suspense fallback={<p className="panel text-mute">Loading your account…</p>}>
        <AccountPanel />
      </Suspense>
    </section>
  );
}
