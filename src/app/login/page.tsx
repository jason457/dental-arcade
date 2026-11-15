import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/supabase/env";
import { AuthForm } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="flex flex-col gap-4">
      <p className="kicker">Player account</p>
      <h1 className="text-2xl font-bold">Sign in to save your progress</h1>
      {!supabaseConfigured() && (
        <p className="panel text-dentine">Accounts are not switched on in this deployment yet. The demo is playable without one.</p>
      )}
      <AuthForm />
    </section>
  );
}
