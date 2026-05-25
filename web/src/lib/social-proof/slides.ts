import type { SocialProofReviewDto } from "./reviews-queries";

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
  | SocialProofInformationalSlide
  | SocialProofReviewSlide
  | SocialProofCounterSlide;

export function buildSocialProofSlides(options: {
  items: import("./queries").SocialProofActivityItemDto[];
  streamNotificationId?: string;
  combo?: { count: number; hours: number; notificationId?: string } | null;
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
  const slides: SocialProofSlide[] = options.items.map((item, index) => ({
    kind: "activity",
    key: `activity-${item.completedAtIso}-${index}`,
    notificationId: options.streamNotificationId,
    item,
  }));

  if (options.combo && options.combo.count > 0) {
    slides.unshift({
      kind: "combo",
      key: "combo-aggregate",
      notificationId: options.combo.notificationId,
      count: options.combo.count,
      hours: options.combo.hours,
    });
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
