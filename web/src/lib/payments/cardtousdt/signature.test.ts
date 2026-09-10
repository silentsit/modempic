import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cardToUsdtCanonicalString, verifyCardToUsdtSignature } from "./signature";

function sign(secret: string, timestamp: string, txidOut: string, valueCoin: string, coin: string) {
  const canonical = cardToUsdtCanonicalString({ timestamp, txidOut, valueCoin, coin });
  return `v1=${createHmac("sha256", secret).update(canonical, "utf8").digest("hex")}`;
}

describe("verifyCardToUsdtSignature", () => {
  const secret = "whsec_8k2mN0pQ1rS3tU4vW5xY6zA7bC8dE9f0";
  const timestamp = "1756112580";
  const txidOut = "0xabc";
  const valueCoin = "250.12";
  const coin = "polygon_usdc";

  it("accepts a matching v1 hex signature including the whsec_ prefix", () => {
    expect(
      verifyCardToUsdtSignature({
        webhookSecret: secret,
        timestamp,
        signature: sign(secret, timestamp, txidOut, valueCoin, coin),
        txidOut,
        valueCoin,
        coin,
      }),
    ).toBe(true);
  });

  it("iterates comma-separated signatures and accepts the matching v1 entry", () => {
    const good = sign(secret, timestamp, txidOut, valueCoin, coin);
    expect(
      verifyCardToUsdtSignature({
        webhookSecret: secret,
        timestamp,
        signature: `v1=deadbeef, ${good}`,
        txidOut,
        valueCoin,
        coin,
      }),
    ).toBe(true);
  });

  it("rejects a whole-header compare style mismatch and a wrong secret", () => {
    expect(
      verifyCardToUsdtSignature({
        webhookSecret: "other",
        timestamp,
        signature: sign(secret, timestamp, txidOut, valueCoin, coin),
        txidOut,
        valueCoin,
        coin,
      }),
    ).toBe(false);
  });

  it("does not treat the raw coin path as the signed coin", () => {
    expect(
      verifyCardToUsdtSignature({
        webhookSecret: secret,
        timestamp,
        signature: sign(secret, timestamp, txidOut, valueCoin, "polygon/usdc"),
        txidOut,
        valueCoin,
        coin: "polygon_usdc",
      }),
    ).toBe(false);
  });
});
