import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventCard, type EventListItem } from "@/components/EventCard";
import { AuthForm } from "@/components/AuthForm";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="py-16 md:py-24 text-center">
        <h1 className="font-display text-5xl md:text-7xl leading-none tracking-tight">
          Fair chances, <br /> not fast fingers.
        </h1>
        <div className="w-24 h-1 bg-black mx-auto my-10" />
        <p className="font-body text-lg md:text-xl max-w-xl mx-auto text-[#525252] mb-16">
          Register for school events with your school email. Winners are chosen by random draw —
          not by who clicked first.
        </p>
        <AuthForm />
      </div>
    );
  }

  const db = createAdminClient();
  const { data: events } = await db
    .from("events")
    .select("*, registrations(status, user_id)")
    .order("starts_at", { ascending: true });

  const shaped: EventListItem[] = (events ?? []).map((e) => {
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

  return (
    <div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tight">Upcoming Events</h1>
      <div className="rule-thick mt-6 mb-12" />

      {shaped.length === 0 ? (
        <p className="font-body text-lg text-[#525252]">No events posted yet — check back soon.</p>
      ) : (
        <div className="grid gap-px bg-black border border-black">
          {shaped.map((event) => (
            <div key={event.id} className="bg-white">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
