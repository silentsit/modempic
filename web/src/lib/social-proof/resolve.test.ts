import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { SOCIAL_PROOF_DEMO_JSON: undefined },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { findMany: vi.fn(), count: vi.fn() },
    product: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { resolveSocialProofActivity } from "./resolve";
import * as queries from "./queries";
import * as synthetic from "./synthetic";
import * as streamAggregates from "./stream-aggregates";

describe("resolveSocialProofActivity", () => {
  it("returns real source when orders exist", async () => {
    vi.spyOn(streamAggregates, "generateStreamAggregates").mockResolvedValue([]);
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({
      items: [
        {
          message: "Alex R. from Denver, CO just completed an order",
          completedAtIso: new Date().toISOString(),
          displayName: "Alex R.",
          actionLine: "just completed an order",
          locationLine: "Denver, CO",
        },
      ],
    });

    const result = await resolveSocialProofActivity({
      windowDays: 7,
      fallbackMode: "auto",
    });
    expect(result.source).toBe("real");
    expect(result.items.length).toBe(1);
    expect(Array.isArray(result.streamAggregates)).toBe(true);
    vi.restoreAllMocks();
  });

  it("uses synthetic fallback in auto mode when empty", async () => {
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({ items: [] });
    vi.spyOn(streamAggregates, "generateStreamAggregates").mockResolvedValue([
      {
        count: 120,
        productHint: "Sleep Support",
        windowLabel: "24 hours",
        windowHours: 24,
      },
    ]);
    vi.spyOn(synthetic, "generateSyntheticActivity").mockResolvedValue([
      {
        message: "Jordan R. from Austin, TX just purchased",
        completedAtIso: new Date().toISOString(),
        displayName: "Jordan R.",
        actionLine: "just purchased",
        locationLine: "Austin, TX",
        productHint: "Sleep Support",
        synthetic: true,
      },
    ]);

    const result = await resolveSocialProofActivity({
      windowDays: 7,
      fallbackMode: "auto",
    });
    expect(result.source).toBe("synthetic");
    expect(result.items[0]?.displayName).toBe("Jordan R.");
    expect(result.streamAggregates.length).toBe(1);
    vi.restoreAllMocks();
  });

  it("returns none when fallback is off and no orders", async () => {
    vi.spyOn(streamAggregates, "generateStreamAggregates").mockResolvedValue([]);
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({ items: [] });

    const result = await resolveSocialProofActivity({
      windowDays: 7,
      fallbackMode: "off",
    });
    expect(result.source).toBe("none");
    expect(result.items).toEqual([]);
    vi.restoreAllMocks();
  });
});
