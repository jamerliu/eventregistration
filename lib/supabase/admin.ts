import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely. NEVER import this into any
// client component or expose SUPABASE_SERVICE_ROLE_KEY to the browser. Only use this after
// you've already verified the request is from an authenticated admin (see lib/session.ts).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
