import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// NEXT_PUBLIC_* values are inlined into the static build, so these must be plain `process.env.X` reads.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until you add your Supabase project URL and publishable (anon) key to .env.local – see README. */
export const cloudConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;
/** Browser-only singleton. Returns null on the server (static export) or when the keys are missing, so the build never needs them. */
export function getSupabase(): SupabaseClient | null {
  if (!cloudConfigured || typeof window === 'undefined') return null;
  client ??= createClient(url as string, key as string, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
