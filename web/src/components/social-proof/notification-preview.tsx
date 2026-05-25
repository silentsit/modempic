"use client";

import { NotificationCard, samplePreviewSlide } from "./notification-card";
import type { SocialProofNotification, SocialProofNotificationConfig } from "@/lib/social-proof/schema";
import { DEFAULT_NOTIFICATION_CONFIG } from "@/lib/social-proof/schema";

export function SocialProofNotificationPreview({
  type,
  config,
  brandLabel = "Modempic",
}: {
  type: SocialProofNotification["type"];
  config?: Partial<SocialProofNotificationConfig>;
  brandLabel?: string;
}) {
  const cfg = { ...DEFAULT_NOTIFICATION_CONFIG, ...config };
  const slide = samplePreviewSlide(
    type === "informational"
      ? "informational"
      : type === "combo"
        ? "combo"
        : type === "reviews"
          ? "reviews"
          : type === "counter"
            ? "counter"
            : "stream",
  );

  if (type === "informational" && config?.informational) {
    (slide as Extract<typeof slide, { kind: "informational" }>).title = config.informational.title;
    (slide as Extract<typeof slide, { kind: "informational" }>).body = config.informational.body;
    if (config.informational.icon) {
      (slide as Extract<typeof slide, { kind: "informational" }>).icon = config.informational.icon;
    }
  }

  return (
    <div className="rounded-lg border border-[#dcdcde] bg-[#f6f7f7] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#50575e]">Preview</p>
      <NotificationCard
        slide={slide}
        cfg={cfg}
        brandLabel={brandLabel}
        comboMessage={config?.comboMessage}
        preview
      />
    </div>
  );
}
