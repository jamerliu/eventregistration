import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  yearGroup: "1A" | "2A" | "EXCHANGE" | null;
  role: "STUDENT" | "ADMIN";
};

// Reads the currently signed-in user (if any) and keeps their admin status in sync with
// the admin_emails table — manage that table directly in the Supabase Table Editor to
// grant or revoke admin access, no redeploy needed.
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const admin = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, first_name, last_name, year_group, role")
    .eq("id", user.id)
    .single();

  const { data: allowListed } = await admin
    .from("admin_emails")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  let role: "STUDENT" | "ADMIN" = (profile?.role as "STUDENT" | "ADMIN") ?? "STUDENT";

  // Only ever auto-promote here; never auto-demote silently, in case an admin is being
  // managed by hand directly in the database.
  if (allowListed && role !== "ADMIN") {
    await admin.from("profiles").update({ role: "ADMIN" }).eq("id", user.id);
    role = "ADMIN";
  }

  return {
    id: user.id,
    email: user.email,
    name: profile?.name ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    yearGroup: (profile?.year_group as "1A" | "2A" | "EXCHANGE") ?? null,
    role,
  };
}
