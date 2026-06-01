import { describe, expect, it } from "vitest";
import { normalizeBtcpayServerUrl } from "./btcpay-url";

describe("normalizeBtcpayServerUrl", () => {
  it("strips trailing slash", () => {
    expect(normalizeBtcpayServerUrl("https://pay.example.com/")).toBe("https://pay.example.com");
  });

  it("removes accidental store path from pasted URL", () => {
    expect(normalizeBtcpayServerUrl("https://pay.example.com/stores/abc123")).toBe("https://pay.example.com");
  });

  it("uses origin only so API paths are not doubled", () => {
    expect(normalizeBtcpayServerUrl("https://pay.example.com/api/v1")).toBe("https://pay.example.com");
  });
});
