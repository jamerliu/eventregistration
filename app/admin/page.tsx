import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  const db = createAdminClient();
  const { data: events } = await db
    .from("events")
    .select("*, registrations(status)")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">Admin</h1>
        <div className="flex gap-4">
          <Link href="/admin/trash">
            <Button variant="secondary">Recycle Bin</Button>
          </Link>
          <Link href="/admin/events/new">
            <Button>New Event →</Button>
          </Link>
        </div>
      </div>
      <div className="rule-thick mt-6 mb-12" />

      {!events || events.length === 0 ? (
        <p className="font-body text-lg text-[#525252]">No events yet. Create your first one.</p>
      ) : (
        <div className="border border-black divide-y divide-black">
          {events.map((e) => {
            const active = e.registrations.filter((r: { status: string }) => r.status !== "CANCELLED");
            return (
              <Link
                key={e.id}
                href={`/admin/events/${e.id}`}
                className="instant flex items-center justify-between gap-6 p-6 hover:bg-black hover:text-white"
              >
                <div>
                  <h2 className="font-display text-2xl">{e.title}</h2>
                  <p className="font-mono text-xs uppercase tracking-widest opacity-70 mt-2">
                    {active.length} registered · max {e.max_attendees} · {e.draw_status}
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
