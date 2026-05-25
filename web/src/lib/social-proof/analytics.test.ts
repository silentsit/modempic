import { describe, expect, it } from "vitest";
import {
  applyAnalyticsEvent,
  getNotificationAnalytics,
} from "./analytics";
import { DEFAULT_ANALYTICS_STORE } from "./analytics-schema";
import {
  computeClickThroughRate,
  formatClickThroughRate,
  notificationNotShownRecently,
} from "./diagnostics";

describe("applyAnalyticsEvent", () => {
  it("increments impressions and sets lastShownAt", () => {
    const updated = applyAnalyticsEvent(DEFAULT_ANALYTICS_STORE, "n1", "impression", "2026-01-01T12:00:00.000Z");
    const stats = getNotificationAnalytics(updated, "n1");
    expect(stats.impressions).toBe(1);
    expect(stats.lastShownAt).toBe("2026-01-01T12:00:00.000Z");
  });

  it("increments clicks separately", () => {
    let store = applyAnalyticsEvent(DEFAULT_ANALYTICS_STORE, "n1", "impression");
    store = applyAnalyticsEvent(store, "n1", "click", "2026-01-02T12:00:00.000Z");
    const stats = getNotificationAnalytics(store, "n1");
    expect(stats.impressions).toBe(1);
    expect(stats.clicks).toBe(1);
    expect(stats.lastClickAt).toBe("2026-01-02T12:00:00.000Z");
  });
});

describe("diagnostics", () => {
  it("computes CTR", () => {
    expect(computeClickThroughRate({ impressions: 10, clicks: 2, dismisses: 0 })).toBe(20);
    expect(formatClickThroughRate({ impressions: 0, clicks: 0, dismisses: 0 })).toBe("—");
  });

  it("flags active notifications not shown in 24h", () => {
    const now = Date.parse("2026-05-25T12:00:00.000Z");
    expect(
      notificationNotShownRecently(
        { status: "active", createdAt: "2026-05-20T12:00:00.000Z" },
        { impressions: 5, clicks: 1, dismisses: 0, lastShownAt: "2026-05-24T11:00:00.000Z" },
        now,
      ),
    ).toBe(true);

    expect(
      notificationNotShownRecently(
        { status: "active", createdAt: "2026-05-20T12:00:00.000Z" },
        { impressions: 5, clicks: 1, dismisses: 0, lastShownAt: "2026-05-25T10:00:00.000Z" },
        now,
      ),
    ).toBe(false);

    expect(
      notificationNotShownRecently(
        { status: "paused", createdAt: "2026-05-20T12:00:00.000Z" },
        { impressions: 0, clicks: 0, dismisses: 0 },
        now,
      ),
    ).toBe(false);
  });
});
