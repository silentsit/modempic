import { afterEach, describe, expect, it } from "vitest";
import { googleMeasurementId } from "./google-tag";

describe("googleMeasurementId", () => {
  const original = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = original;
  });

  it("uses the env id when set", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTONLY1";
    expect(googleMeasurementId()).toBe("G-TESTONLY1");
  });

  it("falls back when Vercel production has no env id", () => {
    const prev = process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    process.env.VERCEL_ENV = "production";
    expect(googleMeasurementId()).toBe("G-PTC500RDB4");
    if (prev === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prev;
  });
});
