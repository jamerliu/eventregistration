import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/events/:id/promote — admin pulls the next person off the waitlist,
// e.g. after a selected student cancels and a spot opens up.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("*").eq("id", params.id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.draw_status !== "DRAWN") {
    return NextResponse.json({ error: "The draw hasn't happened yet for this event" }, { status: 400 });
  }

  const { count: selectedCount } = await db
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "SELECTED");

  if ((selectedCount ?? 0) >= event.max_attendees) {
    return NextResponse.json({ error: "There are no open spots to fill" }, { status: 400 });
  }

  // Oldest waitlisted registration = first in line, preserving draw order.
  const { data: next } = await db
    .from("registrations")
    .select("id, profiles(email, name)")
    .eq("event_id", event.id)
    .eq("status", "WAITLISTED")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!next) return NextResponse.json({ error: "The waitlist is empty" }, { status: 400 });

  const profile = next.profiles as unknown as { email: string; name: string | null };

  await db.from("registrations").update({ status: "SELECTED" }).eq("id", next.id);

  return NextResponse.json({ promoted: { name: profile.name, email: profile.email } });
}
