const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Bucketed relative time labels (NotificationX-style), no date-fns. */
export function formatTimeAgo(isoOrDate: string | Date, now: Date = new Date()): string {
  const then = typeof isoOrDate === "string" ? Date.parse(isoOrDate) : isoOrDate.getTime();
  if (Number.isNaN(then)) return "some time ago";

  const diffMs = Math.max(0, now.getTime() - then);
  if (diffMs < MINUTE) return "just now";
  if (diffMs < 5 * MINUTE) return "1 min ago";
  if (diffMs < 15 * MINUTE) return "5 min ago";
  if (diffMs < 30 * MINUTE) return "15 min ago";
  if (diffMs < HOUR) return "30 min ago";
  if (diffMs < 2 * HOUR) return "1h ago";
  if (diffMs < 5 * HOUR) return "2h ago";
  if (diffMs < 12 * HOUR) return "5h ago";
  if (diffMs < DAY) return "12h ago";
  if (diffMs < 2 * DAY) return "1 day ago";
  if (diffMs < 4 * DAY) return "2 days ago";
  if (diffMs < 8 * DAY) return "3 days ago";
  if (diffMs < 15 * DAY) return "1 week ago";
  if (diffMs < 30 * DAY) return "2 weeks ago";
  if (diffMs < 60 * DAY) return "1 month ago";
  return "some time ago";
}
