/** Supabase is optional in local development. Pages degrade to signed-out when it is not configured. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = () => SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;
