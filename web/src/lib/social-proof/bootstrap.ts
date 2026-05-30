import {
  isSocialProofGloballyEnabled,
  loadSocialProofStore,
  pickActiveComboNotification,
  pickActiveCounterNotification,
  pickActiveInformationalNotifications,
  pickActiveReviewsNotifications,
  pickActiveStreamNotification,
  pickPrimaryDisplayNotification,
} from "./config";
import { getSocialProofDisplayCount } from "./display-count";
import { resolveSocialProofActivity } from "./resolve";
import { fetchApprovedReviewsForSocialProof } from "./reviews-queries";
import { buildSocialProofSlides } from "./slides";
import { generateComboSlides } from "./stream-aggregates";
import type { SocialProofBootstrap } from "./types";

export type { SocialProofBootstrap };

function stripInternalFields<T extends { synthetic?: boolean }>(items: T[]): Omit<T, "synthetic">[] {
  return items.map((item) => {
    const { synthetic: _ignored, ...rest } = item;
    void _ignored;
    return rest;
  });
}

/** Server-only: initial payload for storefront social proof; null when disabled or empty. */
export async function loadSocialProofBootstrapOrNull(): Promise<SocialProofBootstrap | null> {
  const store = await loadSocialProofStore();
  if (!isSocialProofGloballyEnabled(store.global)) return null;

  const primary = pickPrimaryDisplayNotification(store);
  if (!primary) return null;

  const stream = pickActiveStreamNotification(store);
  const combo = pickActiveComboNotification(store);
  const counter = pickActiveCounterNotification(store);
  const informational = pickActiveInformationalNotifications(store);
  const reviewsNotifications = pickActiveReviewsNotifications(store);

  const streamCfg = stream?.config ?? primary.config;
  const aggregateHours = combo?.config.aggregateHours ?? streamCfg.aggregateHours ?? 24;

  let resolved;
  try {
    resolved = await resolveSocialProofActivity({
      windowDays: streamCfg.windowDays,
      take: 15,
      maxAgeHours: streamCfg.maxAgeHours,
      fallbackMode: store.global.fallbackMode,
      demoItems: store.global.demoItems,
      showLocation: streamCfg.showLocation,
      streamNotificationId: stream?.id ?? primary.id,
    });
  } catch (err) {
    console.error("[social-proof] bootstrap query failed:", err instanceof Error ? err.message : err);
    return null;
  }

  const items = stripInternalFields(resolved.items);
  const comboSlides = combo
    ? await generateComboSlides({
        comboNotificationId: combo.id,
        aggregateHours,
      })
    : null;

  const informationalSlides = informational
    .map((n) => {
      const content = n.config.informational;
      if (!content) return null;
      return {
        id: n.id,
        notificationId: n.id,
        title: content.title,
        body: content.body,
        icon: content.icon,
        linkUrl: content.linkUrl,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const reviewSlides: Array<{ notificationId?: string; review: Awaited<ReturnType<typeof fetchApprovedReviewsForSocialProof>>[number] }> = [];
  for (const rn of reviewsNotifications) {
    const rc = rn.config.reviews ?? { minRating: 4, take: 8, windowDays: 30 };
    const batch = await fetchApprovedReviewsForSocialProof({
      windowDays: rc.windowDays,
      take: rc.take,
      minRating: rc.minRating,
    });
    for (const review of batch) {
      reviewSlides.push({ notificationId: rn.id, review });
    }
  }

  let counterData: { count: number; message: string; notificationId?: string } | null = null;
  if (counter?.config.counter) {
    const cc = counter.config.counter;
    counterData = {
      count: getSocialProofDisplayCount(`counter:${counter.id}`),
      message: cc.message,
      notificationId: counter.id,
    };
  }

  const slides = buildSocialProofSlides({
    items,
    streamNotificationId: stream?.id ?? primary.id,
    streamAggregates: resolved.streamAggregates,
    combos: comboSlides,
    comboNotificationId: combo?.id,
    informational: informationalSlides,
    reviews: reviewSlides,
    counter: counterData,
  });

  if (!slides.length) return null;

  return {
    slides,
    windowDays: streamCfg.windowDays,
    global: {
      brandLabel: store.global.brandLabel.trim() || "Modempic",
      debugMode: store.global.debugMode,
    },
    notification: {
      id: primary.id,
      name: primary.name,
      config: primary.config,
    },
    streamNotificationId: stream?.id,
    comboNotificationId: combo?.id,
    counterNotification: counter
      ? {
          id: counter.id,
          scope: counter.config.counter?.scope ?? "page",
          windowMinutes: counter.config.counter?.windowMinutes ?? 5,
          message: counter.config.counter?.message ?? "visitors are online",
        }
      : undefined,
    comboMessage: combo?.config.comboMessage,
    comboSlides: comboSlides ?? undefined,
    streamAggregates: resolved.streamAggregates,
    ...(resolved.source !== "none" ? { dataSource: resolved.source } : {}),
  };
}
