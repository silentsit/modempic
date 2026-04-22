import { createHash, randomBytes } from "node:crypto";
import type { CryptoAsset } from "@prisma/client";
import type { CreateCryptoPaymentResult } from "./types";

const PROVIDER = "crypto_sim";

/**
 * Simulated USDT-on-like payment instructions for local/dev. Production plugs in BTCPay/NOW/etc.
 */
export function createSimulatedCryptoPayment(input: { orderId: string; amountCents: number; asset: CryptoAsset }): CreateCryptoPaymentResult {
  const externalId = `sim_${createHash("sha256").update(`${input.orderId}-${Date.now()}-${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 32)}`;
  const payAddress = `0x${createHash("sha256").update(externalId).digest("hex").slice(0, 40)}`;
  const idempotencyKey = `pay_init_${externalId}`;

  const isDev = process.env.DEV_PAYMENT_SIMULATE === "1" || process.env.NODE_ENV === "development";

  return {
    method: "CRYPTO",
    provider: PROVIDER,
    externalId,
    payAddress,
    payAmountLabel: isDev ? (input.amountCents / 100).toFixed(2) : (input.amountCents / 100).toFixed(2) + " USDT (example)",
    asset: input.asset,
    expiresAt: new Date(Date.now() + 1000 * 60 * 45),
    idempotencyKey,
  };
}

export function isSimProvider(provider: string) {
  return provider === PROVIDER;
}

export { PROVIDER as CRYPTO_SIM_PROVIDER };
