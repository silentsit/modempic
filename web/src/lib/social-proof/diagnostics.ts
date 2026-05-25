import type { NotificationAnalytics } from "./analytics-schema";
import type { SocialProofNotification } from "./schema";

const STALE_HOURS = 24;

export function computeClickThroughRate(stats: NotificationAnalytics): number | null {
  if (stats.impressions <= 0) return null;
  return Math.round((stats.clicks / stats.impressions) * 1000) / 10;
}

export function formatClickThroughRate(stats: NotificationAnalytics): string {
  const ctr = computeClickThroughRate(stats);
  if (ctr == null) return "—";
  return `${ctr}%`;
}

export function hoursSinceIso(iso: string | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (now - t) / (60 * 60 * 1000);
}

/** Active notification with no storefront impression in the last 24 hours. */
export function notificationNotShownRecently(
  notification: Pick<SocialProofNotification, "status" | "createdAt">,
  stats: NotificationAnalytics,
  now = Date.now(),
): boolean {
  if (notification.status !== "active") return false;

  if (!stats.lastShownAt) {
    const created = notification.createdAt ? Date.parse(notification.createdAt) : NaN;
    if (Number.isNaN(created)) return stats.impressions === 0;
    const ageHours = (now - created) / (60 * 60 * 1000);
    return ageHours >= STALE_HOURS;
  }

  const hours = hoursSinceIso(stats.lastShownAt, now);
  return hours != null && hours >= STALE_HOURS;
}

export function formatRelativeHours(iso: string | undefined): string {
  const hours = hoursSinceIso(iso);
  if (hours == null) return "Never";
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
