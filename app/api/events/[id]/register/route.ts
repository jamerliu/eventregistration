import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/events/:id/register — a student signs up for an event
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("*").eq("id", params.id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event.draw_status !== "OPEN") {
    return NextResponse.json({ error: "Registration is closed for this event" }, { status: 400 });
  }
  if (new Date() > new Date(event.registration_deadline)) {
    return NextResponse.json({ error: "The registration deadline has passed" }, { status: 400 });
  }

  // Re-registering after a cancellation just flips the row back to PENDING, so we don't
  // lose history and the unique(user_id, event_id) constraint holds.
  const { error } = await db
    .from("registrations")
    .upsert(
      { user_id: user.id, event_id: event.id, status: "PENDING" },
      { onConflict: "user_id,event_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE /api/events/:id/register — a student withdraws before the draw happens
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("draw_status").eq("id", params.id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event.draw_status === "DRAWN") {
    return NextResponse.json(
      { error: "The draw has already happened — contact an admin if you need to withdraw" },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("registrations")
    .update({ status: "CANCELLED" })
    .eq("user_id", user.id)
    .eq("event_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
