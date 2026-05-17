/** Format helpers used across public pages. Phase 2. */

export function formatShortDate(d: Date): string {
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toLowerCase();
}

export function formatMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toLowerCase();
}

export function formatLongDate(d: Date): string {
  return d
    .toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    .toLowerCase();
}

export function padNum(n: number, width = 3): string {
  return n.toString().padStart(width, "0");
}

export function stripMarkers(s: string): string {
  return s
    .replace(/\*/g, "")
    .replace(/==/g, "")
    .replace(/\[\[|\]\]/g, "");
}
