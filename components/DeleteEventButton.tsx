"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Move this event to the recycle bin? Students will no longer see it, but you can restore it later.")) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <Button variant="secondary" onClick={handleDelete} disabled={loading}>
      {loading ? "Working…" : "Move to Recycle Bin"}
    </Button>
  );
}
