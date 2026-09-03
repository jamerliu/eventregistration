"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side client — used only inside "use client" components for auth actions
// (sign in / sign out). All actual data reads/writes go through our own API routes.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
