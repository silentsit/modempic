"use client";

import type { SocialProofEventType } from "./analytics-schema";

export type SocialProofTrackPayload = {
  notificationId: string;
  event: SocialProofEventType;
  pathname?: string;
  slideKey?: string;
};

export function sendSocialProofEvent(payload: SocialProofTrackPayload): void {
  const body = JSON.stringify(payload);
  const url = "/api/social-proof/event";

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through */
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* fire-and-forget */
  });
}
