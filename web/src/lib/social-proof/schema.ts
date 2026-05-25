import { z } from "zod";

export const SOCIAL_PROOF_STORE_KEY = "socialProof.store";

export const socialProofTypeSchema = z.enum(["stream", "combo", "informational", "reviews", "counter"]);
export type SocialProofType = z.infer<typeof socialProofTypeSchema>;

export const informationalIconSchema = z.enum(["shield", "truck", "star"]);
export type InformationalIcon = z.infer<typeof informationalIconSchema>;

export const informationalContentSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(280),
  icon: informationalIconSchema.default("shield"),
  linkUrl: z.string().max(500).optional(),
});

export type InformationalContent = z.infer<typeof informationalContentSchema>;

export const reviewsContentSchema = z.object({
  minRating: z.number().int().min(1).max(5).default(4),
  take: z.number().int().min(1).max(15).default(8),
  windowDays: z.number().int().min(1).max(90).default(30),
});

export type ReviewsContent = z.infer<typeof reviewsContentSchema>;

export const counterContentSchema = z.object({
  scope: z.enum(["page", "site"]).default("page"),
  windowMinutes: z.number().int().min(1).max(30).default(5),
  minDisplay: z.number().int().min(1).max(50).default(2),
  message: z.string().max(200).default("people are viewing this page"),
});

export type CounterContent = z.infer<typeof counterContentSchema>;

export const socialProofStatusSchema = z.enum(["draft", "active", "paused"]);
export type SocialProofStatus = z.infer<typeof socialProofStatusSchema>;

export const fallbackModeSchema = z.enum(["auto", "off", "demo_only"]);
export type FallbackMode = z.infer<typeof fallbackModeSchema>;

export const positionSchema = z.enum(["bottom-left", "bottom-right", "top-left", "top-right"]);
export type SocialProofPosition = z.infer<typeof positionSchema>;

/** Default path prefixes hidden even when show-on paths is `*`. */
export const DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS = [
  "/checkout",
  "/cart",
  "/account",
  "/admin",
  "/login",
  "/register",
  "/order",
] as const;

export const notificationConfigSchema = z.object({
  windowDays: z.number().int().min(1).max(14).default(7),
  aggregateHours: z.number().int().min(1).max(720).optional(),
  paths: z.array(z.string()).default(["/", "/shop", "/product"]),
  excludePaths: z.array(z.string()).default([...DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS]),
  mobileEnabled: z.boolean().default(true),
  position: positionSchema.default("bottom-left"),
  /** When set, overrides `position` on small screens. */
  mobilePosition: positionSchema.optional(),
  showLocation: z.boolean().default(true),
  showProductImage: z.boolean().default(true),
  maxAgeHours: z.number().int().min(1).max(720).default(72),
  initialDelaySec: z.number().int().min(0).max(120).default(3),
  displayDurationSec: z.number().int().min(2).max(60).default(7),
  gapBetweenSec: z.number().int().min(1).max(120).default(5),
  loop: z.boolean().default(true),
  dismissible: z.boolean().default(true),
  snoozeHours: z.number().int().min(1).max(168).default(4),
  clickable: z.boolean().default(true),
  roundedPx: z.number().int().min(0).max(32).default(16),
  informational: informationalContentSchema.optional(),
  comboMessage: z.string().max(200).optional(),
  reviews: reviewsContentSchema.optional(),
  counter: counterContentSchema.optional(),
});

export type SocialProofNotificationConfig = z.infer<typeof notificationConfigSchema>;

export const demoItemSchema = z.object({
  message: z.string().min(1),
  completedAtIso: z.string().min(1),
  displayName: z.string().optional(),
  actionLine: z.string().optional(),
  locationLine: z.string().nullable().optional(),
  productHint: z.string().optional(),
});

export type SocialProofDemoItem = z.infer<typeof demoItemSchema>;

export const globalConfigSchema = z.object({
  enabled: z.boolean().default(false),
  brandLabel: z.string().min(1).max(64).default("Modempic"),
  fallbackMode: fallbackModeSchema.default("auto"),
  debugMode: z.boolean().default(false),
  demoItems: z.array(demoItemSchema).default([]),
});

export type SocialProofGlobalConfig = z.infer<typeof globalConfigSchema>;

export const notificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  type: socialProofTypeSchema,
  status: socialProofStatusSchema,
  priority: z.number().int().min(0).max(999).default(0),
  config: notificationConfigSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SocialProofNotification = z.infer<typeof notificationSchema>;

export const storeSchema = z.object({
  global: globalConfigSchema.default({}),
  notifications: z.array(notificationSchema).default([]),
});

export type SocialProofStore = z.infer<typeof storeSchema>;

export const DEFAULT_NOTIFICATION_CONFIG: SocialProofNotificationConfig =
  notificationConfigSchema.parse({});

export const DEFAULT_GLOBAL_CONFIG: SocialProofGlobalConfig = globalConfigSchema.parse({});

export const DEFAULT_STORE: SocialProofStore = {
  global: DEFAULT_GLOBAL_CONFIG,
  notifications: [],
};

export function parseSocialProofStore(raw: unknown): SocialProofStore {
  const parsed = storeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return DEFAULT_STORE;
}

export function createDefaultStreamNotification(name = "Recent purchases"): SocialProofNotification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    type: "stream",
    status: "active",
    priority: 0,
    config: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      aggregateHours: 24,
      showProductImage: true,
      clickable: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultComboNotification(name = "Orders in last 24h"): SocialProofNotification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    type: "combo",
    status: "active",
    priority: 1,
    config: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      aggregateHours: 24,
      comboMessage: "completed an order",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultInformationalNotification(
  name = "Free shipping",
  content: InformationalContent = {
    title: "Free US shipping",
    body: "On orders $50 and over — delivered to your door.",
    icon: "truck",
  },
): SocialProofNotification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    type: "informational",
    status: "active",
    priority: 2,
    config: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      informational: content,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultReviewsNotification(name = "Recent reviews"): SocialProofNotification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    type: "reviews",
    status: "active",
    priority: 3,
    config: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      reviews: { minRating: 4, take: 8, windowDays: 30 },
      showProductImage: true,
      clickable: true,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultCounterNotification(name = "Live visitors"): SocialProofNotification {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    type: "counter",
    status: "active",
    priority: 4,
    config: {
      ...DEFAULT_NOTIFICATION_CONFIG,
      counter: {
        scope: "page",
        windowMinutes: 5,
        minDisplay: 2,
        message: "people are viewing this page",
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}
