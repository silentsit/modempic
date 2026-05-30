import type { SocialProofReviewDto } from "./reviews-queries";
import type { ComboSlideDto, StreamAggregateDto } from "./stream-aggregates";

export type SocialProofActivitySlide = {
  kind: "activity";
  key: string;
  notificationId?: string;
  item: import("./queries").SocialProofActivityItemDto;
};

export type SocialProofComboSlide = {
  kind: "combo";
  key: string;
  notificationId?: string;
  count: number;
  hours: number;
  windowLabel?: string;
  productHint?: string;
  productSlug?: string;
  productImageUrl?: string;
};

export type SocialProofPurchaseAggregateSlide = {
  kind: "purchase_aggregate";
  key: string;
  notificationId?: string;
  count: number;
  productHint: string;
  productSlug?: string;
  productImageUrl?: string;
  windowLabel: string;
};

export type SocialProofInformationalSlide = {
  kind: "informational";
  key: string;
  notificationId?: string;
  title: string;
  body: string;
  icon?: import("./schema").InformationalIcon;
  linkUrl?: string;
};

export type SocialProofReviewSlide = {
  kind: "review";
  key: string;
  notificationId?: string;
  review: SocialProofReviewDto;
};

export type SocialProofCounterSlide = {
  kind: "counter";
  key: string;
  notificationId?: string;
  count: number;
  message: string;
};

export type SocialProofSlide =
  | SocialProofActivitySlide
  | SocialProofComboSlide
  | SocialProofPurchaseAggregateSlide
  | SocialProofInformationalSlide
  | SocialProofReviewSlide
  | SocialProofCounterSlide;

function interleaveAggregates(
  activitySlides: SocialProofActivitySlide[],
  aggregates: StreamAggregateDto[],
  streamNotificationId?: string,
): SocialProofSlide[] {
  if (!aggregates.length) return activitySlides;
  const result: SocialProofSlide[] = [];
  let aggIdx = 0;
  const interval = Math.max(1, Math.floor(activitySlides.length / (aggregates.length + 1)));

  for (let i = 0; i < activitySlides.length; i++) {
    result.push(activitySlides[i]!);
    if ((i + 1) % interval === 0 && aggIdx < aggregates.length) {
      const agg = aggregates[aggIdx]!;
      result.push({
        kind: "purchase_aggregate",
        key: `aggregate-${agg.productSlug ?? agg.productHint}-${agg.windowHours}-${aggIdx}`,
        notificationId: streamNotificationId,
        count: agg.count,
        productHint: agg.productHint,
        ...(agg.productSlug ? { productSlug: agg.productSlug } : {}),
        ...(agg.productImageUrl ? { productImageUrl: agg.productImageUrl } : {}),
        windowLabel: agg.windowLabel,
      });
      aggIdx++;
    }
  }
  while (aggIdx < aggregates.length) {
    const agg = aggregates[aggIdx]!;
    result.push({
      kind: "purchase_aggregate",
      key: `aggregate-${agg.productSlug ?? agg.productHint}-${agg.windowHours}-${aggIdx}`,
      notificationId: streamNotificationId,
      count: agg.count,
      productHint: agg.productHint,
      ...(agg.productSlug ? { productSlug: agg.productSlug } : {}),
      ...(agg.productImageUrl ? { productImageUrl: agg.productImageUrl } : {}),
      windowLabel: agg.windowLabel,
    });
    aggIdx++;
  }
  return result;
}

export function buildSocialProofSlides(options: {
  items: import("./queries").SocialProofActivityItemDto[];
  streamNotificationId?: string;
  streamAggregates?: StreamAggregateDto[];
  combos?: ComboSlideDto[] | null;
  comboNotificationId?: string;
  informational?: Array<{
    id: string;
    notificationId?: string;
    title: string;
    body: string;
    icon?: import("./schema").InformationalIcon;
    linkUrl?: string;
  }>;
  reviews?: Array<{ notificationId?: string; review: SocialProofReviewDto }>;
  counter?: { count: number; message: string; notificationId?: string } | null;
}): SocialProofSlide[] {
  const activitySlides: SocialProofActivitySlide[] = options.items.map((item, index) => ({
    kind: "activity",
    key: `activity-${item.completedAtIso}-${index}`,
    notificationId: options.streamNotificationId,
    item,
  }));

  let slides: SocialProofSlide[] = interleaveAggregates(
    activitySlides,
    options.streamAggregates ?? [],
    options.streamNotificationId,
  );

  if (options.combos?.length) {
    for (let i = options.combos.length - 1; i >= 0; i--) {
      const combo = options.combos[i]!;
      const key = combo.productSlug
        ? `combo-product-${combo.productSlug}-${combo.hours}-${i}`
        : `combo-site-${combo.hours}`;
      slides.unshift({
        kind: "combo",
        key,
        notificationId: options.comboNotificationId,
        count: combo.count,
        hours: combo.hours,
        windowLabel: combo.windowLabel,
        ...(combo.productHint ? { productHint: combo.productHint } : {}),
        ...(combo.productSlug ? { productSlug: combo.productSlug } : {}),
        ...(combo.productImageUrl ? { productImageUrl: combo.productImageUrl } : {}),
      });
    }
  }

  if (options.counter && options.counter.count > 0) {
    slides.unshift({
      kind: "counter",
      key: "counter-live",
      notificationId: options.counter.notificationId,
      count: options.counter.count,
      message: options.counter.message,
    });
  }

  for (const r of options.reviews ?? []) {
    slides.push({
      kind: "review",
      key: `review-${r.review.id}`,
      notificationId: r.notificationId,
      review: r.review,
    });
  }

  for (const info of options.informational ?? []) {
    slides.push({
      kind: "informational",
      key: `informational-${info.id}`,
      notificationId: info.notificationId ?? info.id,
      title: info.title,
      body: info.body,
      icon: info.icon,
      linkUrl: info.linkUrl,
    });
  }

  return slides;
}
