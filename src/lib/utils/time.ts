const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Human-friendly timestamp: "just now", "5 minutes ago", "2 days ago", then a date. */
export function formatRelativeTime(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);
  const secondsAgo = Math.round((date.getTime() - Date.now()) / 1_000);
  const absolute = Math.abs(secondsAgo);

  if (absolute < 45) return "just now";
  if (absolute < HOUR) return relative.format(Math.round(secondsAgo / MINUTE), "minute");
  if (absolute < DAY) return relative.format(Math.round(secondsAgo / HOUR), "hour");
  if (absolute < WEEK) return relative.format(Math.round(secondsAgo / DAY), "day");

  return date.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}
