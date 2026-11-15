"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  notice?: string;
}
const NOT_CONFIGURED = "Accounts are not switched on yet. Add the Supabase keys to the environment first.";

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/account");
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const displayName = String(form.get("displayName") ?? "").trim();
  const ref = String(form.get("ref") ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  if (!email || password.length < 8) return { error: "Use a valid email and a password of at least 8 characters." };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName || null, ref: ref || null } } });
  if (error) return { error: error.message };
  if (!data.session) return { notice: "Check your email to confirm your account, then sign in." };
  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
