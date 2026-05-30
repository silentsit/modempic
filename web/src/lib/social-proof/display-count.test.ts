import { describe, expect, it } from "vitest";
import { formatAggregateWindow, getSocialProofDisplayCount } from "./display-count";

describe("getSocialProofDisplayCount", () => {
  it("returns values in 50–999 range", () => {
    for (const seed of ["combo:abc", "counter:xyz", "aggregate:prod:24"]) {
      const count = getSocialProofDisplayCount(seed);
      expect(count).toBeGreaterThanOrEqual(50);
      expect(count).toBeLessThanOrEqual(999);
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

describe("formatAggregateWindow", () => {
  it("maps hours to human labels", () => {
    expect(formatAggregateWindow(24)).toBe("24 hours");
    expect(formatAggregateWindow(48)).toBe("7 days");
    expect(formatAggregateWindow(168)).toBe("7 days");
    expect(formatAggregateWindow(720)).toBe("30 days");
  });
});
