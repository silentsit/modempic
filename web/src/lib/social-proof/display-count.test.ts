import { describe, expect, it } from "vitest";
import {
  clampSocialProofDisplayCount,
  clampSocialProofViewerCount,
  formatAggregateWindow,
  getSocialProofDisplayCount,
  getSocialProofViewerCount,
  SOCIAL_PROOF_DISPLAY_COUNT_MAX,
  SOCIAL_PROOF_DISPLAY_COUNT_MIN,
  SOCIAL_PROOF_VIEWER_COUNT_MAX,
  SOCIAL_PROOF_VIEWER_COUNT_MIN,
} from "./display-count";

describe("getSocialProofDisplayCount", () => {
  it("returns values in 3–50 range", () => {
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
    const values = new Set(
      ["combo:a", "combo:b", "combo:c", "aggregate:x", "aggregate:y"].map((seed) =>
        getSocialProofDisplayCount(seed),
      ),
    );
    expect(values.size).toBeGreaterThan(1);
  });
});

describe("clampSocialProofDisplayCount", () => {
  it("clamps values into the allowed band", () => {
    expect(clampSocialProofDisplayCount(1)).toBe(3);
    expect(clampSocialProofDisplayCount(42)).toBe(42);
    expect(clampSocialProofDisplayCount(870)).toBe(50);
  });
});

describe("getSocialProofViewerCount", () => {
  it("returns values in 7–20 range", () => {
    for (const seed of ["counter:abc", "counter:xyz", "page:/product/modalert-200mg"]) {
      const count = getSocialProofViewerCount(seed);
      expect(count).toBeGreaterThanOrEqual(SOCIAL_PROOF_VIEWER_COUNT_MIN);
      expect(count).toBeLessThanOrEqual(SOCIAL_PROOF_VIEWER_COUNT_MAX);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(getSocialProofViewerCount("counter:test-id")).toBe(getSocialProofViewerCount("counter:test-id"));
  });
});

describe("clampSocialProofViewerCount", () => {
  it("never exceeds 20", () => {
    expect(clampSocialProofViewerCount(1)).toBe(7);
    expect(clampSocialProofViewerCount(14)).toBe(14);
    expect(clampSocialProofViewerCount(21)).toBe(20);
    expect(clampSocialProofViewerCount(300)).toBe(20);
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
