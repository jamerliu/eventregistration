"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DrawControls({
  eventId,
  drawStatus,
  spotsOpen,
  waitlistHasPeople,
}: {
  eventId: string;
  drawStatus: "OPEN" | "CLOSED" | "DRAWN";
  spotsOpen: boolean;
  waitlistHasPeople: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function runDraw() {
    if (
      !confirm(
        "Run the random draw now? This closes registration and cannot be undone. Everyone will be emailed their result."
      )
    )
      return;
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/draw`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    setMessage(`Draw complete: ${data.selectedCount} selected, ${data.waitlistedCount} waitlisted.`);
    router.refresh();
  }

  async function promote() {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventId}/promote`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    setMessage(`Promoted ${data.promoted.name ?? data.promoted.email} from the waitlist.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {drawStatus !== "DRAWN" && (
          <Button onClick={runDraw} disabled={loading}>
            {loading ? "Working…" : "Run Random Draw"}
          </Button>
        )}
        {drawStatus === "DRAWN" && spotsOpen && waitlistHasPeople && (
          <Button variant="secondary" onClick={promote} disabled={loading}>
            {loading ? "Working…" : "Promote Next From Waitlist"}
          </Button>
        )}
      </div>
      {message && <p className="font-body text-sm italic">{message}</p>}
    </div>
  );
}
