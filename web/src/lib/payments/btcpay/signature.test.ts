import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyBtcpayWebhook } from "./signature";

describe("verifyBtcpayWebhook", () => {
  const secret = "test-webhook-secret";
  const body = '{"type":"InvoiceSettled","invoiceId":"inv_123"}';

  it("accepts valid sha256= HMAC", () => {
    const hex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyBtcpayWebhook(body, `sha256=${hex}`, secret)).toBe(true);
  });

  it("rejects wrong signature", () => {
    expect(verifyBtcpayWebhook(body, "sha256=deadbeef", secret)).toBe(false);
  });

  it("rejects missing signature", () => {
    expect(verifyBtcpayWebhook(body, null, secret)).toBe(false);
  });
});
