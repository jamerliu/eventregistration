import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RegisterButton } from "@/components/RegisterButton";

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const db = createAdminClient();
  const { data: event } = await db
    .from("events")
    .select("*, registrations(status, user_id)")
    .eq("id", params.id)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  const active = event.registrations.filter((r: { status: string }) => r.status !== "CANCELLED");
  const mine = event.registrations.find((r: { user_id: string }) => r.user_id === user.id);
  const myStatus: string | null = mine?.status ?? null;

  const deadlinePassed = new Date() > new Date(event.registration_deadline);
  const canRegister = event.draw_status === "OPEN" && !deadlinePassed && (myStatus === null || myStatus === "CANCELLED");
  const canCancel = event.draw_status !== "DRAWN" && myStatus === "PENDING";

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-6">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-tight">{event.title}</h1>
        <StatusBadge status={myStatus as never} />
      </div>

      <div className="rule-thick mt-8 mb-8" />

      <dl className="grid grid-cols-2 gap-y-4 font-mono text-xs uppercase tracking-widest text-[#525252] mb-10">
        <dt>When</dt>
        <dd className="text-black normal-case font-body text-base">{formatDate(new Date(event.starts_at))}</dd>
        <dt>Where</dt>
        <dd className="text-black normal-case font-body text-base">{event.location}</dd>
        <dt>Registration deadline</dt>
        <dd className="text-black normal-case font-body text-base">{formatDate(new Date(event.registration_deadline))}</dd>
        <dt>Capacity</dt>
        <dd className="text-black normal-case font-body text-base">
          {event.max_attendees} spots — {active.length} registered so far
        </dd>
      </dl>

      <p className="font-body text-lg leading-relaxed mb-10 whitespace-pre-wrap">{event.description}</p>

      <div className="rule-hairline mb-10" />

      <RegisterButton eventId={event.id} myStatus={myStatus as never} canRegister={canRegister} canCancel={canCancel} />

      <p className="font-body text-sm text-[#525252] italic mt-10">
        Spots are awarded by random draw after the registration deadline — registering early doesn&apos;t
        improve your odds. You&apos;ll get an email with the result either way.
      </p>
    </div>
  );
}
