import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DrawControls } from "@/components/DrawControls";
import { EmailExport } from "@/components/EmailExport";
import { DeleteEventButton } from "@/components/DeleteEventButton";

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const { data: registrations } = await db
    .from("registrations")
    .select("id, status, created_at, profiles(name, email, year_group)")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  const rows = registrations ?? [];
  const active = rows.filter((r) => r.status !== "CANCELLED");
  const selectedCount = rows.filter((r) => r.status === "SELECTED").length;
  const waitlisted = rows.filter((r) => r.status === "WAITLISTED");

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <h1 className="font-display text-5xl tracking-tight">{event.title}</h1>
        <DeleteEventButton eventId={event.id} />
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-[#525252] mt-4">
        {active.length} active registrations · capacity {event.max_attendees} · status {event.draw_status}
      </p>

      <div className="rule-thick mt-6 mb-10" />

      <DrawControls
        eventId={event.id}
        drawStatus={event.draw_status}
        spotsOpen={selectedCount < event.max_attendees}
        waitlistHasPeople={waitlisted.length > 0}
      />

      <div className="rule-hairline my-10" />

      <EmailExport registrants={rows as never} />

      <div className="rule-hairline my-10" />

      <h2 className="font-display text-2xl mb-6">Registrants</h2>

      {rows.length === 0 ? (
        <p className="font-body text-[#525252]">No one has registered yet.</p>
      ) : (
        <table className="w-full border border-black">
          <thead>
            <tr className="border-b-2 border-black font-mono text-xs uppercase tracking-widest text-left">
              <th className="p-4">Name</th>
              <th className="p-4">Year</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLight">
            {rows.map((r) => {
              const profile = r.profiles as unknown as { name: string | null; email: string; year_group: string | null };
              return (
                <tr key={r.id} className="font-body">
                  <td className="p-4">{profile?.name ?? "—"}</td>
                  <td className="p-4 font-mono text-xs uppercase">{profile?.year_group ?? "—"}</td>
                  <td className="p-4">{profile?.email}</td>
                  <td className="p-4">
                    <StatusBadge status={r.status as never} />
                  </td>
                  <td className="p-4 font-mono text-xs">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
