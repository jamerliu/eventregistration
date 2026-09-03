import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/events — list all events, with the current user's registration status attached
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const { data: events, error } = await db
    .from("events")
    .select("*, registrations(status, user_id)")
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped = events.map((e) => {
    const active = e.registrations.filter((r: { status: string }) => r.status !== "CANCELLED");
    const mine = e.registrations.find((r: { user_id: string }) => r.user_id === user.id);
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startsAt: e.starts_at,
      registrationDeadline: e.registration_deadline,
      maxAttendees: e.max_attendees,
      drawStatus: e.draw_status,
      registrantCount: active.length,
      myStatus: mine?.status ?? null,
    };
  });

  return NextResponse.json(shaped);
}

// POST /api/events — create a new event (admin only)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, location, startsAt, registrationDeadline, maxAttendees } = body;

  if (!title || !description || !location || !startsAt || !registrationDeadline || !maxAttendees) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .insert({
      title,
      description,
      location,
      starts_at: new Date(startsAt).toISOString(),
      registration_deadline: new Date(registrationDeadline).toISOString(),
      max_attendees: Number(maxAttendees),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
