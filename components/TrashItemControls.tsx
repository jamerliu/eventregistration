"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function TrashItemControls({ eventId, title }: { eventId: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function restore() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/restore`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  async function deleteForever() {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone — all registration data for this event will be lost.`)) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/permanent`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button variant="secondary" onClick={restore} disabled={loading}>
        {loading ? "Working…" : "Restore"}
      </Button>
      <Button variant="danger" onClick={deleteForever} disabled={loading}>
        Delete Forever
      </Button>
    </div>
  );
}
