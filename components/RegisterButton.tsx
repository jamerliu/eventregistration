"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Status = "PENDING" | "SELECTED" | "WAITLISTED" | "NOT_SELECTED" | "CANCELLED" | null;

export function RegisterButton({
  eventId,
  myStatus,
  canRegister,
  canCancel,
}: {
  eventId: string;
  myStatus: Status;
  canRegister: boolean;
  canCancel: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function register() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Cancel your registration for this event?")) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/register`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {canRegister && (
        <Button onClick={register} disabled={loading}>
          {loading ? "Registering…" : "Register"}
        </Button>
      )}
      {canCancel && (
        <Button variant="secondary" onClick={cancel} disabled={loading}>
          {loading ? "Cancelling…" : "Cancel registration"}
        </Button>
      )}
      {!canRegister && !canCancel && myStatus === null && (
        <p className="font-mono text-xs uppercase tracking-widest text-[#525252]">
          Registration is not currently open.
        </p>
      )}
      {error && <p className="font-body text-sm mt-4 text-black italic">{error}</p>}
    </div>
  );
}
