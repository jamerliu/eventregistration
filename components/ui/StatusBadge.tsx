type Status = "PENDING" | "SELECTED" | "WAITLISTED" | "NOT_SELECTED" | "CANCELLED" | null;

const labels: Record<string, string> = {
  PENDING: "Registered — awaiting draw",
  SELECTED: "Selected",
  WAITLISTED: "Waitlisted",
  NOT_SELECTED: "Not selected",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: Status }) {
  if (!status) return null;
  const inverted = status === "SELECTED";
  return (
    <span
      className={`inline-block font-mono text-xs uppercase tracking-widest px-3 py-1 border border-black ${
        inverted ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
