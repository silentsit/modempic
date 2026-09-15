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

  it("does not invent purchases in auto mode when empty", async () => {
    const syntheticSpy = vi.spyOn(synthetic, "generateSyntheticActivity");
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({ items: [] });
    vi.spyOn(streamAggregates, "generateStreamAggregates").mockResolvedValue([]);

    const result = await resolveSocialProofActivity({
      windowDays: 7,
      fallbackMode: "auto",
    });
    expect(result.source).toBe("none");
    expect(result.items).toEqual([]);
    expect(syntheticSpy).not.toHaveBeenCalled();
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
