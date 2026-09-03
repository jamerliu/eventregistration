"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title"),
      description: form.get("description"),
      location: form.get("location"),
      startsAt: form.get("startsAt"),
      registrationDeadline: form.get("registrationDeadline"),
      maxAttendees: form.get("maxAttendees"),
    };

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    const event = await res.json();
    router.push(`/admin/events/${event.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-5xl tracking-tight">New Event</h1>
      <div className="rule-thick mt-6 mb-12" />

      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <Label>Title</Label>
          <Input name="title" required placeholder="Spring Formal" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" required rows={5} placeholder="What is this event, and what should students know?" />
        </div>
        <div>
          <Label>Location</Label>
          <Input name="location" required placeholder="Main Gymnasium" />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <Label>Event date &amp; time</Label>
            <Input type="datetime-local" name="startsAt" required />
          </div>
          <div>
            <Label>Registration deadline</Label>
            <Input type="datetime-local" name="registrationDeadline" required />
          </div>
        </div>
        <div>
          <Label>Max attendees</Label>
          <Input type="number" name="maxAttendees" min={1} required placeholder="100" />
        </div>

        {error && <p className="font-body text-sm italic">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Event"}
        </Button>
      </form>
    </div>
  );
}
