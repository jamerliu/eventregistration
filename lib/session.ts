import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "ADMIN";
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Reads the currently signed-in user (if any) and keeps their admin status in sync with
// the ADMIN_EMAILS env var — so promoting/demoting an admin is just an env var change,
// no manual database edit required, and no chicken-and-egg problem for the first admin.
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const shouldBeAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
  let role: "STUDENT" | "ADMIN" = (profile?.role as "STUDENT" | "ADMIN") ?? "STUDENT";

  // Only ever auto-promote here; never auto-demote silently, in case an admin is being
  // managed by hand directly in the database.
  if (shouldBeAdmin && role !== "ADMIN") {
    const admin = createAdminClient();
    await admin.from("profiles").update({ role: "ADMIN" }).eq("id", user.id);
    role = "ADMIN";
  }

  return {
    id: user.id,
    email: user.email,
    name: profile?.name ?? null,
    role,
  };
}
