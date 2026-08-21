import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPeptidePayWebhook } from "./signature";

function sign(secret: string, t: string, body: string) {
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

describe("verifyPeptidePayWebhook", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "order.paid", order_id: "MP-1" });

  it("accepts a fresh valid signature", () => {
    const t = String(Math.floor(Date.now() / 1000));
    expect(verifyPeptidePayWebhook(body, sign(secret, t, body), secret)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    const t = String(Math.floor(Date.now() / 1000));
    expect(verifyPeptidePayWebhook(body, sign("whsec_other", t, body), secret)).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const t = String(Math.floor(Date.now() / 1000) - 400);
    expect(verifyPeptidePayWebhook(body, sign(secret, t, body), secret)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyPeptidePayWebhook(body, null, secret)).toBe(false);
  });

  it("accepts a quoted secret and reordered header fields", () => {
    const t = String(Math.floor(Date.now() / 1000));
    const header = sign(secret, t, body).replace(/^(t=\d+),(v1=.+)$/, "$2,$1");
    expect(verifyPeptidePayWebhook(body, header, `" ${secret} "`)).toBe(true);
  });
});

