import { describe, expect, it } from "vitest";
import { isReusableGatewayUrl } from "./checkout-payment-sessions";

describe("isReusableGatewayUrl", () => {
  it("accepts a live https gateway URL", () => {
    expect(isReusableGatewayUrl("https://pay.qistdigital.com/session/cs_abc")).toBe(true);
  });

  it("rejects missing or non-http values", () => {
    expect(isReusableGatewayUrl(null)).toBe(false);
    expect(isReusableGatewayUrl("")).toBe(false);
    expect(isReusableGatewayUrl("0xabc")).toBe(false);
  });

  it("rejects an expired URL", () => {
    expect(isReusableGatewayUrl("https://pay.example/session", new Date(Date.now() - 1000))).toBe(false);
  });

  it("accepts a URL that expires in the future", () => {
    expect(isReusableGatewayUrl("https://pay.example/session", new Date(Date.now() + 60_000))).toBe(true);
  });
});
