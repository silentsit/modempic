import { randomBytes, createHash } from "node:crypto";
import { env } from "@/lib/env";
import type { CreateCardOnrampResult } from "./types";

const PROVIDER = "guardarian";

/**
 * Configurable on-ramp adapter. Wires to Guardarian (or similar) public widget/API when keys are set.
 * widgetUrl is a placeholder; replace with real partner URL construction per their docs.
 */
export function createGuardarianSession(input: { orderId: string; orderNumber: string; amountCents: number; email: string }): CreateCardOnrampResult {
  if (!env.GUARDARIAN_API_KEY) {
    const externalId = `gdsandbox_${createHash("sha256").update(`${input.orderId}-${randomBytes(4).toString("hex")}`).digest("hex").slice(0, 24)}`;
    return {
      method: "CARD_ONRAMP",
      provider: PROVIDER,
      externalId,
      widgetUrl: `/api/payments/guardarian/sandbox-redirect?orderNumber=${encodeURIComponent(input.orderNumber)}&amount=${(input.amountCents / 100).toFixed(2)}&email=${encodeURIComponent(input.email)}`,
      idempotencyKey: `g_${externalId}`,
    };
  }
  // Placeholder: real implementation calls Guardarian API, returns hosted URL.
  const externalId = `gd_${createHash("sha256").update(`${input.orderId}-${Date.now()}`).digest("hex").slice(0, 28)}`;
  return {
    method: "CARD_ONRAMP",
    provider: PROVIDER,
    externalId,
    widgetUrl: `https://guardarian.com/placeholder?id=${encodeURIComponent(externalId)}`,
    idempotencyKey: `g_${externalId}`,
  };
}

export function isGuardarianProvider(p: string) {
  return p === PROVIDER;
}
