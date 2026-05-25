import {
  DEFAULT_ANALYTICS,
  notificationAnalyticsSchema,
  type NotificationAnalytics,
  type SocialProofAnalyticsStore,
  type SocialProofEventType,
} from "./analytics-schema";

export function getNotificationAnalytics(
  store: SocialProofAnalyticsStore,
  notificationId: string,
): NotificationAnalytics {
  return store.notifications[notificationId] ?? DEFAULT_ANALYTICS;
}

export function applyAnalyticsEvent(
  store: SocialProofAnalyticsStore,
  notificationId: string,
  event: SocialProofEventType,
  atIso = new Date().toISOString(),
): SocialProofAnalyticsStore {
  const current = getNotificationAnalytics(store, notificationId);
  const next = notificationAnalyticsSchema.parse({
    ...current,
    ...(event === "impression"
      ? { impressions: current.impressions + 1, lastShownAt: atIso }
      : event === "click"
        ? { clicks: current.clicks + 1, lastClickAt: atIso }
        : { dismisses: current.dismisses + 1, lastDismissAt: atIso }),
  });

  return {
    notifications: {
      ...store.notifications,
      [notificationId]: next,
    },
  };
}
