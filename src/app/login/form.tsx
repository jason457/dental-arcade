"use client";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const field = "w-full rounded-lg border-2 border-line bg-black/30 px-3 py-3 text-enamel outline-none focus:border-xray";

export function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = inPending || upPending;
  return (
    <form action={mode === "in" ? inAction : upAction} className="flex flex-col gap-3">
      <div className="flex gap-2" role="tablist">
        {(["in", "up"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`flex-1 rounded-lg border-2 px-3 py-2 font-semibold ${mode === m ? "border-dentine text-dentine" : "border-line text-mute"}`}>
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      {mode === "up" && (
        <label className="flex flex-col gap-1 text-sm text-mute" htmlFor="displayName">Display name
          <input id="displayName" name="displayName" className={field} autoComplete="nickname" />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm text-mute" htmlFor="email">Email
        <input id="email" name="email" type="email" required className={field} autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-mute" htmlFor="password">Password
        <input id="password" name="password" type="password" required minLength={8} className={field} autoComplete={mode === "in" ? "current-password" : "new-password"} />
      </label>
      {mode === "up" && (
        <label className="flex flex-col gap-1 text-sm text-mute" htmlFor="ref">Referral code, if a friend invited you
          <input id="ref" name="ref" className={field} autoComplete="off" />
        </label>
      )}
      {state.error && <p role="alert" className="text-bad">{state.error}</p>}
      {state.notice && <p role="status" className="text-ok">{state.notice}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Working…" : mode === "in" ? "Sign in ▶" : "Create account ▶"}</button>
    </form>
  );
}
