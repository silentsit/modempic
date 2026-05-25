import { z } from "zod";

export const SOCIAL_PROOF_ANALYTICS_KEY = "socialProof.analytics";

export const socialProofEventTypeSchema = z.enum(["impression", "click", "dismiss"]);
export type SocialProofEventType = z.infer<typeof socialProofEventTypeSchema>;

export const notificationAnalyticsSchema = z.object({
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  dismisses: z.number().int().min(0).default(0),
  lastShownAt: z.string().optional(),
  lastClickAt: z.string().optional(),
  lastDismissAt: z.string().optional(),
});

export type NotificationAnalytics = z.infer<typeof notificationAnalyticsSchema>;

export const analyticsStoreSchema = z.object({
  notifications: z.record(z.string(), notificationAnalyticsSchema).default({}),
});

export type SocialProofAnalyticsStore = z.infer<typeof analyticsStoreSchema>;

export const DEFAULT_ANALYTICS: NotificationAnalytics = notificationAnalyticsSchema.parse({});

export const DEFAULT_ANALYTICS_STORE: SocialProofAnalyticsStore = {
  notifications: {},
};

export function parseAnalyticsStore(raw: unknown): SocialProofAnalyticsStore {
  const parsed = analyticsStoreSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return DEFAULT_ANALYTICS_STORE;
}
