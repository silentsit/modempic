import { describe, expect, it } from "vitest";
import {
  clampSocialProofDisplayCount,
  formatAggregateWindow,
  getSocialProofDisplayCount,
  SOCIAL_PROOF_DISPLAY_COUNT_MAX,
  SOCIAL_PROOF_DISPLAY_COUNT_MIN,
} from "./display-count";

describe("getSocialProofDisplayCount", () => {
  it("returns values in 7–300 range", () => {
    for (const seed of ["combo:abc", "counter:xyz", "aggregate:prod:24"]) {
      const count = getSocialProofDisplayCount(seed);
      expect(count).toBeGreaterThanOrEqual(SOCIAL_PROOF_DISPLAY_COUNT_MIN);
      expect(count).toBeLessThanOrEqual(SOCIAL_PROOF_DISPLAY_COUNT_MAX);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(getSocialProofDisplayCount("combo:test-id")).toBe(getSocialProofDisplayCount("combo:test-id"));
  });

  it("varies across different seeds", () => {
    const a = getSocialProofDisplayCount("combo:a");
    const b = getSocialProofDisplayCount("combo:b");
    expect(a).not.toBe(b);
  });
});

describe("clampSocialProofDisplayCount", () => {
  it("clamps values into the allowed band", () => {
    expect(clampSocialProofDisplayCount(1)).toBe(7);
    expect(clampSocialProofDisplayCount(42)).toBe(42);
    expect(clampSocialProofDisplayCount(870)).toBe(300);
  });
});

describe("formatAggregateWindow", () => {
  it("maps hours to human labels", () => {
    expect(formatAggregateWindow(24)).toBe("24 hours");
    expect(formatAggregateWindow(48)).toBe("7 days");
    expect(formatAggregateWindow(168)).toBe("7 days");
    expect(formatAggregateWindow(720)).toBe("30 days");
  });
});
