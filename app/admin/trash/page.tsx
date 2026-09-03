import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrashItemControls } from "@/components/TrashItemControls";

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  const db = createAdminClient();
  const { data: events } = await db
    .from("events")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">Recycle Bin</h1>
        <Link
          href="/admin"
          className="font-mono text-xs uppercase tracking-widest underline underline-offset-4"
        >
          ← Back to Admin
        </Link>
      </div>
      <div className="rule-thick mt-6 mb-12" />

      {!events || events.length === 0 ? (
        <p className="font-body text-lg text-[#525252]">The recycle bin is empty.</p>
      ) : (
        <div className="border border-black divide-y divide-black">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-6 p-6">
              <div>
                <h2 className="font-display text-2xl">{e.title}</h2>
                <p className="font-mono text-xs uppercase tracking-widest text-[#525252] mt-2">
                  Deleted {new Date(e.deleted_at).toLocaleString()}
                </p>
              </div>
              <TrashItemControls eventId={e.id} title={e.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
