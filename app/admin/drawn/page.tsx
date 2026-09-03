import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DrawnEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  const db = createAdminClient();
  const { data: events } = await db
    .from("events")
    .select("*, registrations(status)")
    .is("deleted_at", null)
    .eq("draw_status", "DRAWN")
    .order("starts_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">Drawn Events</h1>
        <Link
          href="/admin"
          className="font-mono text-xs uppercase tracking-widest underline underline-offset-4"
        >
          ← Back to Admin
        </Link>
      </div>
      <div className="rule-thick mt-6 mb-12" />

      {!events || events.length === 0 ? (
        <p className="font-body text-lg text-[#525252]">
          No events have had their draw run yet.
        </p>
      ) : (
        <div className="border border-black divide-y divide-black">
          {events.map((e) => {
            const selected = e.registrations.filter((r: { status: string }) => r.status === "SELECTED").length;
            const waitlisted = e.registrations.filter((r: { status: string }) => r.status === "WAITLISTED").length;
            return (
              <Link
                key={e.id}
                href={`/admin/events/${e.id}`}
                className="instant flex items-center justify-between gap-6 p-6 hover:bg-black hover:text-white"
              >
                <div>
                  <h2 className="font-display text-2xl">{e.title}</h2>
                  <p className="font-mono text-xs uppercase tracking-widest opacity-70 mt-2">
                    {selected} selected · {waitlisted} waitlisted · max {e.max_attendees}
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-widest">Manage →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
