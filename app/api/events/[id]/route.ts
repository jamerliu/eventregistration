import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/events/:id — event details plus (for admins) the full registrant list
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: event, error } = await db
    .from("events")
    .select("*, registrations(status, user_id)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .single();

  if (error || !event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const active = event.registrations.filter((r: { status: string }) => r.status !== "CANCELLED");
  const mine = event.registrations.find((r: { user_id: string }) => r.user_id === user.id);

  let registrants = undefined;
  if (user.role === "ADMIN") {
    const { data } = await db
      .from("registrations")
      .select("id, status, created_at, profiles(name, email)")
      .eq("event_id", params.id)
      .order("created_at", { ascending: true });
    registrants = data;
  }

  return NextResponse.json({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.starts_at,
    registrationDeadline: event.registration_deadline,
    maxAttendees: event.max_attendees,
    drawStatus: event.draw_status,
    registrantCount: active.length,
    myStatus: mine?.status ?? null,
    registrants,
  });
}

// PATCH /api/events/:id — edit event details (admin only)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.location !== undefined) data.location = body.location;
  if (body.maxAttendees !== undefined) data.max_attendees = body.maxAttendees;
  if (body.startsAt) data.starts_at = new Date(body.startsAt).toISOString();
  if (body.registrationDeadline) data.registration_deadline = new Date(body.registrationDeadline).toISOString();

  const db = createAdminClient();
  const { error } = await db.from("events").update(data).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/events/:id — move an event to the recycle bin (admin only).
// This is a soft delete: it sets deleted_at rather than removing the row, so it can be
// restored later from Admin → Recycle Bin. Use /api/events/:id/permanent to erase for good.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { error } = await db.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
