import { describe, expect, it } from "vitest";
import { normalizeBtcpayApiKey, normalizeBtcpayStoreId } from "./btcpay-credentials";

describe("normalizeBtcpayApiKey", () => {
  it("trims whitespace", () => {
    expect(normalizeBtcpayApiKey("  abc123  ")).toBe("abc123");
  });

  it("removes accidental token prefix", () => {
    expect(normalizeBtcpayApiKey("token secretkey")).toBe("secretkey");
  });

  it("removes surrounding quotes", () => {
    expect(normalizeBtcpayApiKey('"mykey"')).toBe("mykey");
  });
});

describe("normalizeBtcpayStoreId", () => {
  it("trims store id", () => {
    expect(normalizeBtcpayStoreId("  store123  ")).toBe("store123");
  });
});
