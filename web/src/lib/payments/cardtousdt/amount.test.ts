import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    AUTH_SECRET: "00000000000000000000000000000000",
    CARDTOUSDT_API_BASE: undefined,
  },
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: () => "http://localhost:3000",
}));

import {
  cardToUsdtChargeAmount,
  cardToUsdtCoinInfoPath,
  cardToUsdtCoinInfoUrl,
  cardToUsdtPaidUsd,
  isCardToUsdtUsdStable,
  meetsCardToUsdtFulfillBand,
} from "./amount";

describe("cardToUsdt amount helpers", () => {
  it("treats documented USD stables as already-USD units", () => {
    expect(isCardToUsdtUsdStable("polygon_usdc")).toBe(true);
    expect(isCardToUsdtUsdStable("erc20_usdt")).toBe(true);
    expect(isCardToUsdtUsdStable("polygon_pol")).toBe(false);
  });

  it("replaces every underscore in the coin info path", () => {
    expect(cardToUsdtCoinInfoPath("polygon_pol")).toBe("polygon/pol");
    expect(cardToUsdtCoinInfoPath("bep20_bnb")).toBe("bep20/bnb");
    expect(cardToUsdtCoinInfoPath("eth")).toBe("eth");
    expect(cardToUsdtCoinInfoUrl("polygon_pol")).toBe("https://api.cardtousdt.to/crypto/polygon/pol/info.php");
  });

  it("returns value_coin for USD stables without a price lookup", async () => {
    const fetchImpl = vi.fn();
    await expect(cardToUsdtPaidUsd("249.4", "erc20_usdc", fetchImpl)).resolves.toBe(249.4);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("multiplies native coins by prices.USD and holds when the quote is missing", async () => {
    const ok = vi.fn(async () =>
      new Response(JSON.stringify({ prices: { USD: 0.5 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(cardToUsdtPaidUsd("10", "polygon_pol", ok as unknown as typeof fetch)).resolves.toBe(5);

    const missing = vi.fn(async () =>
      new Response(JSON.stringify({ prices: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(cardToUsdtPaidUsd("10", "eth", missing as unknown as typeof fetch)).resolves.toBeNull();
  });

  it("fulfils at or above the configured band", () => {
    expect(meetsCardToUsdtFulfillBand(200, 250, 0.8)).toBe(true);
    expect(meetsCardToUsdtFulfillBand(199.99, 250, 0.8)).toBe(false);
    expect(meetsCardToUsdtFulfillBand(250, 250, 1)).toBe(true);
  });

  it("sends checkout amounts as two-decimal USD, not raw cents division", () => {
    expect(cardToUsdtChargeAmount(1999)).toBe(19.99);
    expect(cardToUsdtChargeAmount(10)).toBe(0.1);
  });
});
