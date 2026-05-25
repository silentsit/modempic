import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { SOCIAL_PROOF_DEMO_JSON: undefined },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { resolveSocialProofActivity } from "./resolve";
import * as queries from "./queries";
import * as synthetic from "./synthetic";

describe("resolveSocialProofActivity", () => {
  it("returns real source when orders exist", async () => {
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({
      items: [
        {
          message: "Alex from Denver, CO just completed an order",
          completedAtIso: new Date().toISOString(),
          displayName: "Alex",
          actionLine: "Just completed an order.",
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
    vi.restoreAllMocks();
  });

  it("uses synthetic fallback in auto mode when empty", async () => {
    vi.spyOn(queries, "fetchRecentSocialProofActivity").mockResolvedValue({ items: [] });
    vi.spyOn(synthetic, "generateSyntheticActivity").mockResolvedValue([
      {
        message: "Jordan just viewed the shop",
        completedAtIso: new Date().toISOString(),
        displayName: "Jordan",
        actionLine: "Just viewed the shop.",
        locationLine: "Austin, TX",
        synthetic: true,
      },
    ]);

    const result = await resolveSocialProofActivity({
      windowDays: 7,
      fallbackMode: "auto",
    });
    expect(result.source).toBe("synthetic");
    expect(result.items[0]?.displayName).toBe("Jordan");
    vi.restoreAllMocks();
  });

  it("returns none when fallback is off and no orders", async () => {
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
