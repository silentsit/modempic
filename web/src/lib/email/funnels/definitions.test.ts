import { describe, expect, it } from "vitest";
import {
  FUNNEL_STEP_DELAYS,
  funnelStepCount,
  hoursToMs,
  nextSendAtAfterStep,
} from "@/lib/email/funnels/definitions";

describe("email funnel definitions", () => {
  it("each funnel has 3–5 steps", () => {
    for (const type of Object.keys(FUNNEL_STEP_DELAYS) as (keyof typeof FUNNEL_STEP_DELAYS)[]) {
      const count = funnelStepCount(type);
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  it("welcome has 4 steps with immediate first send", () => {
    expect(FUNNEL_STEP_DELAYS.WELCOME_SIGNUP).toHaveLength(4);
    expect(FUNNEL_STEP_DELAYS.WELCOME_SIGNUP[0]).toBe(0);
  });

  it("abandoned cart has 5 steps", () => {
    expect(FUNNEL_STEP_DELAYS.ABANDONED_CART).toHaveLength(5);
    expect(FUNNEL_STEP_DELAYS.ABANDONED_CART[0]).toBe(1);
  });

  it("unpaid order has 4 steps", () => {
    expect(FUNNEL_STEP_DELAYS.UNPAID_ORDER).toHaveLength(4);
  });

  it("nextSendAtAfterStep uses delay from previous send", () => {
    const from = new Date("2026-06-06T12:00:00.000Z");
    const next = nextSendAtAfterStep(0, "WELCOME_SIGNUP", from);
    expect(next?.toISOString()).toBe("2026-06-07T12:00:00.000Z");
    expect(nextSendAtAfterStep(FUNNEL_STEP_DELAYS.WELCOME_SIGNUP.length - 1, "WELCOME_SIGNUP", from)).toBeNull();
  });

  it("hoursToMs converts correctly", () => {
    expect(hoursToMs(1)).toBe(3_600_000);
  });
});
