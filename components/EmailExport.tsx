"use client";

import { useState } from "react";

type Registrant = { status: string; profiles: { email: string; name: string | null } | null };

const GROUPS: { status: string; label: string }[] = [
  { status: "SELECTED", label: "Selected" },
  { status: "WAITLISTED", label: "Waitlisted" },
  { status: "NOT_SELECTED", label: "Not selected" },
  { status: "PENDING", label: "Pending (draw not yet run)" },
];

// Lets an admin copy the email addresses for a given outcome, to paste into their own
// regular email client (Gmail, Outlook, etc.) as a BCC list — no email service required.
export function EmailExport({ registrants }: { registrants: Registrant[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyGroup(status: string) {
    const emails = registrants
      .filter((r) => r.status === status && r.profiles?.email)
      .map((r) => r.profiles!.email);

    if (emails.length === 0) return;
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(status);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="border border-black p-6">
      <h3 className="font-mono text-xs uppercase tracking-widest mb-4">
        Copy emails to notify manually
      </h3>
      <div className="flex flex-wrap gap-3">
        {GROUPS.map((g) => {
          const count = registrants.filter((r) => r.status === g.status && r.profiles?.email).length;
          if (count === 0) return null;
          return (
            <button
              key={g.status}
              onClick={() => copyGroup(g.status)}
              className="instant font-mono text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white"
            >
              {copied === g.status ? "Copied!" : `${g.label} (${count})`}
            </button>
          );
        })}
      </div>
      <p className="font-body text-sm text-[#525252] italic mt-4">
        Copies a comma-separated list of email addresses — paste it into the BCC field of a
        new email in Gmail, Outlook, or whatever you already use.
      </p>
    </div>
  );
}
