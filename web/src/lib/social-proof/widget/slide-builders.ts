import type { ComboSlideDto, StreamAggregateDto } from "@/lib/social-proof/stream-aggregates";
import type { SocialProofSlide } from "@/lib/social-proof/slides";

export type ActivityApiItem = {
  message: string;
  completedAtIso: string;
  displayName: string;
  actionLine: string;
  locationLine?: string | null;
  productHint?: string;
  productSlug?: string;
  productImageUrl?: string;
  timeLabel?: string;
};

export function aggregatesToSlides(
  aggregates: StreamAggregateDto[],
  streamNotificationId?: string,
): SocialProofSlide[] {
  return aggregates.map((agg, aggIdx) => ({
    kind: "purchase_aggregate" as const,
    key: `aggregate-${agg.productSlug ?? agg.productHint}-${agg.windowHours}-${aggIdx}`,
    notificationId: streamNotificationId,
    count: agg.count,
    productHint: agg.productHint,
    ...(agg.productSlug ? { productSlug: agg.productSlug } : {}),
    ...(agg.productImageUrl ? { productImageUrl: agg.productImageUrl } : {}),
    windowLabel: agg.windowLabel,
  }));
}

export function interleaveActivityAndAggregates(
  activitySlides: SocialProofSlide[],
  aggregateSlides: SocialProofSlide[],
): SocialProofSlide[] {
  if (!aggregateSlides.length) return activitySlides;
  const result: SocialProofSlide[] = [];
  let aggIdx = 0;
  const interval = Math.max(1, Math.floor(activitySlides.length / (aggregateSlides.length + 1)));

  for (let i = 0; i < activitySlides.length; i++) {
    result.push(activitySlides[i]!);
    if ((i + 1) % interval === 0 && aggIdx < aggregateSlides.length) {
      result.push(aggregateSlides[aggIdx]!);
      aggIdx++;
    }
  }
  while (aggIdx < aggregateSlides.length) {
    result.push(aggregateSlides[aggIdx]!);
    aggIdx++;
  }
  return result;
}

export function comboSlidesToSlides(combos: ComboSlideDto[], comboNotificationId?: string): SocialProofSlide[] {
  return combos.map((combo, i) => ({
    kind: "combo" as const,
    key: combo.productSlug
      ? `combo-product-${combo.productSlug}-${combo.hours}-${i}`
      : `combo-site-${combo.hours}`,
    notificationId: comboNotificationId,
    count: combo.count,
    hours: combo.hours,
    windowLabel: combo.windowLabel,
    ...(combo.productHint ? { productHint: combo.productHint } : {}),
    ...(combo.productSlug ? { productSlug: combo.productSlug } : {}),
    ...(combo.productImageUrl ? { productImageUrl: combo.productImageUrl } : {}),
  }));
}

export function rebuildActivitySlides(
  slides: SocialProofSlide[],
  items: ActivityApiItem[],
  streamNotificationId: string | undefined,
  comboSlides?: ComboSlideDto[] | null,
  comboNotificationId?: string,
  counter?: { count: number; message: string; notificationId?: string } | null,
  streamAggregates?: StreamAggregateDto[],
): SocialProofSlide[] {
  const staticSlides = slides.filter((s) => s.kind === "informational" || s.kind === "review");
  const existingCounter = slides.find((s) => s.kind === "counter");
  const activitySlides: SocialProofSlide[] = items.map((item, index) => ({
    kind: "activity",
    key: `activity-${item.completedAtIso}-${index}`,
    notificationId: streamNotificationId,
    item,
  }));

  const aggregateSlides =
    streamAggregates?.length
      ? aggregatesToSlides(streamAggregates, streamNotificationId)
      : slides.filter((s) => s.kind === "purchase_aggregate");

  const interleaved = interleaveActivityAndAggregates(activitySlides, aggregateSlides);
  const next: SocialProofSlide[] = [...interleaved];

  const comboSlideList =
    comboSlides?.length
      ? comboSlidesToSlides(comboSlides, comboNotificationId)
      : slides.filter((s) => s.kind === "combo");

  for (let i = comboSlideList.length - 1; i >= 0; i--) {
    next.unshift(comboSlideList[i]!);
  }

  if (counter && counter.count > 0) {
    next.unshift({
      kind: "counter",
      key: "counter-live",
      notificationId: counter.notificationId,
      count: counter.count,
      message: counter.message,
    });
  } else if (existingCounter && !counter) {
    next.unshift(existingCounter);
  }
  return [...next, ...staticSlides];
}
