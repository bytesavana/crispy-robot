import type { LineApproval, LineOutcome } from "./api/types";
import type { StatusTone } from "@/theme";

export function formatKes(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}

/** Quantities are decimals server-side (1.5 kg of tomatoes) but usually whole — don't show "2.00 ×". */
export function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/0+$/, "");
}

/** Time left to answer an offer. Returns null once it's gone, which callers use to disable the
 * accept button rather than letting someone tap into a server-side rejection. */
export function formatCountdown(expiresAt: string, now: number = Date.now()): string | null {
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "9:00 AM" — the appointment-time display used throughout Calendar and job cards. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "MON, 14 JULY" — the day-section header on the Calendar screen. */
export function formatDayHeading(date: Date): string {
  return date
    .toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" })
    .toUpperCase()
    .replace(",", ",");
}

/** True when two dates fall on the same calendar day, ignoring time of day — how the Calendar
 * screen decides which jobs belong under which day heading. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Monday-first, matching WeekStrip's own week — a Sunday reading "this week" as starting *today*
 * would silently drop every job scheduled Monday through Saturday of the week it's plainly in. */
export function isSameWeek(a: Date, b: Date): boolean {
  const start = startOfDay(b);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return a >= start && a < end;
}

/** What a line's state means to the person looking at it, folding outcome and approval together —
 * "waiting on the customer" is the fact that matters, and it lives across both fields. */
export function lineStateLabel(outcome: LineOutcome, approval: LineApproval): { label: string; tone: StatusTone } {
  if (approval === "Pending") return { label: "Waiting on customer", tone: "new" };
  if (approval === "Declined") return { label: "Customer declined", tone: "failed" };

  switch (outcome) {
    case "Purchased":
      return { label: "Bought", tone: "completed" };
    case "Substituted":
      return { label: "Substituted", tone: "completed" };
    case "NotPurchased":
      return { label: "Not bought", tone: "failed" };
    default:
      return { label: "To buy", tone: "neutral" };
  }
}
