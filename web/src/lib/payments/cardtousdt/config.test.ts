import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    AUTH_SECRET: "00000000000000000000000000000000",
    CARDTOUSDT_PAYOUT_ADDRESS: undefined as string | undefined,
    CARDTOUSDT_WEBHOOK_BASE_URL: undefined as string | undefined,
    CARDTOUSDT_API_BASE: undefined as string | undefined,
    CARDTOUSDT_FULFILL_BAND: undefined as number | undefined,
    AUTH_URL: undefined as string | undefined,
    NEXT_PUBLIC_SITE_URL: undefined as string | undefined,
  },
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: () => mockEnv.AUTH_URL ?? mockEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
}));

import {
  buildCardToUsdtWebhookUrl,
  cardToUsdtOurWebhookSecret,
  isCardToUsdtConfigured,
  isPublicHttpsWebhookOrigin,
  isSafeCardToUsdtCheckoutUrl,
  isValidCardToUsdtPayoutAddress,
} from "./config";

describe("cardToUsdt config", () => {
  beforeEach(() => {
    mockEnv.CARDTOUSDT_PAYOUT_ADDRESS = undefined;
    mockEnv.CARDTOUSDT_WEBHOOK_BASE_URL = undefined;
    mockEnv.AUTH_URL = undefined;
    mockEnv.NEXT_PUBLIC_SITE_URL = undefined;
  });

  it("accepts a self-custodial 0x payout wallet", () => {
    expect(isValidCardToUsdtPayoutAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(true);
    expect(isValidCardToUsdtPayoutAddress("not-an-address")).toBe(false);
  });

  it("rejects localhost, IPs, and CardToUSDT hosts as webhook origins", () => {
    expect(isPublicHttpsWebhookOrigin("https://modempic.com")).toBe(true);
    expect(isPublicHttpsWebhookOrigin("http://modempic.com")).toBe(false);
    expect(isPublicHttpsWebhookOrigin("https://localhost")).toBe(false);
    expect(isPublicHttpsWebhookOrigin("https://127.0.0.1")).toBe(false);
    expect(isPublicHttpsWebhookOrigin("https://api.cardtousdt.to")).toBe(false);
  });

  it("is configured only when payout and a public HTTPS webhook origin exist", () => {
    mockEnv.CARDTOUSDT_PAYOUT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    mockEnv.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(isCardToUsdtConfigured()).toBe(false);

    mockEnv.CARDTOUSDT_WEBHOOK_BASE_URL = "https://tunnel.example.com";
    expect(isCardToUsdtConfigured()).toBe(true);
  });

  it("puts order_id and secret on the webhook URL and never uses a c2t_ prefix", () => {
    mockEnv.CARDTOUSDT_PAYOUT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    mockEnv.CARDTOUSDT_WEBHOOK_BASE_URL = "https://modempic.com";
    const url = buildCardToUsdtWebhookUrl("MP-TEST-1");
    expect(url).toBeTruthy();
    const parsed = new URL(url!);
    expect(parsed.pathname).toBe("/api/webhooks/cardtousdt");
    expect(parsed.searchParams.get("order_id")).toBe("MP-TEST-1");
    expect(parsed.searchParams.get("secret")).toBe(cardToUsdtOurWebhookSecret("MP-TEST-1"));
    expect([...parsed.searchParams.keys()].some((key) => key.startsWith("c2t_"))).toBe(false);
  });

  it("puts an uppercase order_id on the webhook even if the input is mixed case", () => {
    mockEnv.CARDTOUSDT_PAYOUT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    mockEnv.CARDTOUSDT_WEBHOOK_BASE_URL = "https://modempic.com";
    const url = buildCardToUsdtWebhookUrl("mp-test-1");
    expect(new URL(url!).searchParams.get("order_id")).toBe("MP-TEST-1");
    expect(new URL(url!).searchParams.get("secret")).toBe(cardToUsdtOurWebhookSecret("MP-TEST-1"));
  });

  it("accepts https hosted checkout URLs and rejects javascript or http", () => {
    expect(isSafeCardToUsdtCheckoutUrl("https://pay.cardtousdt.to/c/abc")).toBe(true);
    expect(isSafeCardToUsdtCheckoutUrl("http://pay.cardtousdt.to/c/abc")).toBe(false);
    expect(isSafeCardToUsdtCheckoutUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeCardToUsdtCheckoutUrl("/relative")).toBe(false);
  });
});
