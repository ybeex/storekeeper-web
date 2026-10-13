import type { OutstandingState } from "@/lib/api";

const MAP: Record<OutstandingState, { tone: string; label: (d: number) => string }> = {
  overdue: { tone: "bad", label: (d) => (d > 0 ? `Overdue ${d} day${d > 1 ? "s" : ""}` : "Overdue") },
  on_time: { tone: "ok", label: () => "On time" },
  partial_return: { tone: "warn", label: () => "Partial return" },
};

export function StateBadge({ state, days }: { state: OutstandingState; days: number }) {
  const m = MAP[state];
  return <span className={`badge ${m.tone}`}>{m.label(days)}</span>;
}
