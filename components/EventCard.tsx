import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface EventListItem {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  registrationDeadline: string;
  maxAttendees: number;
  drawStatus: "OPEN" | "CLOSED" | "DRAWN";
  registrantCount: number;
  myStatus: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event }: { event: EventListItem }) {
  const deadlinePassed = new Date() > new Date(event.registrationDeadline);

  return (
    <Link href={`/events/${event.id}`} className="group block border border-black instant hover:bg-black hover:text-white">
      <div className="p-8">
        <div className="flex items-start justify-between gap-6">
          <h3 className="font-display text-2xl md:text-3xl leading-tight">{event.title}</h3>
          <StatusBadge status={event.myStatus as never} />
        </div>

        <p className="font-body text-base mt-4 line-clamp-2 opacity-90">{event.description}</p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-widest opacity-70">
          <span>{formatDate(event.startsAt)}</span>
          <span>{event.location}</span>
          <span>{event.registrantCount} registered</span>
          <span>Max {event.maxAttendees}</span>
        </div>

        <div className="mt-4 font-mono text-xs uppercase tracking-widest">
          {event.drawStatus === "DRAWN" ? (
            <span>Draw complete</span>
          ) : deadlinePassed ? (
            <span>Registration closed</span>
          ) : (
            <span>Registration open — deadline {formatDate(event.registrationDeadline)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
