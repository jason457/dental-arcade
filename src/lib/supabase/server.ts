import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./env";

/** Server-side Supabase client bound to the request cookies. Returns null when not configured. */
export async function createClient() {
  if (!supabaseConfigured()) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes sessions.
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string;
  plan: string;
  xp: number;
  referralCode: string | null;
}
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name, role, plan, xp, referral_code").eq("id", data.user.id).maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? null,
    role: profile?.role ?? "learner",
    plan: profile?.plan ?? "free",
    xp: profile?.xp ?? 0,
    referralCode: profile?.referral_code ?? null,
  };
}
