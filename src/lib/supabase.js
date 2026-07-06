import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guard so the app fails loudly with a clear message if env vars are missing.
if (!url || !anonKey) {
  console.warn(
    "[SchoolBridge] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Set them in your .env file (local) and in Netlify → Site settings → Environment variables."
  );
}

export const supabase = createClient(url || "http://localhost", anonKey || "public-anon-key");

export const hasSupabaseConfig = Boolean(url && anonKey);
