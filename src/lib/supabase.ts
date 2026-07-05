import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && serviceKey);

let client: SupabaseClient | null = null;

// Returns null when Supabase isn't configured — callers fall back to the
// in-memory demo store (see src/lib/db.ts). This lets Salin Radio run fully
// in demo mode before a database is provisioned.
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}
