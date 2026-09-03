import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// Fisher–Yates shuffle — unbiased, unlike naively sorting on Math.random().
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/events/:id/draw — admin triggers the random draw for an event.
// Selects up to maxAttendees at random from all PENDING registrants, waitlists the
// remainder in random order. Results are shown in-app and can be exported by the admin
// to email manually — see GET /api/events/:id/export.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("*").eq("id", params.id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.draw_status === "DRAWN") {
    return NextResponse.json({ error: "The draw has already been run for this event" }, { status: 400 });
  }

  const { data: pending, error: pendingError } = await db
    .from("registrations")
    .select("id")
    .eq("event_id", event.id)
    .eq("status", "PENDING");

  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 500 });

  const shuffled = shuffle(pending ?? []);
  const selected = shuffled.slice(0, event.max_attendees);
  const waitlisted = shuffled.slice(event.max_attendees);

  if (selected.length > 0) {
    await db.from("registrations").update({ status: "SELECTED" }).in("id", selected.map((r) => r.id));
  }
  if (waitlisted.length > 0) {
    await db.from("registrations").update({ status: "WAITLISTED" }).in("id", waitlisted.map((r) => r.id));
  }
  await db.from("events").update({ draw_status: "DRAWN" }).eq("id", event.id);

  return NextResponse.json({ selectedCount: selected.length, waitlistedCount: waitlisted.length });
}
