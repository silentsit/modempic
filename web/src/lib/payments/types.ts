import type { CryptoAsset, PaymentStatus } from "@prisma/client";

export type CreateCryptoPaymentResult = {
  method: "CRYPTO";
  provider: string;
  externalId: string;
  payAddress: string;
  payAmountLabel: string;
  asset: CryptoAsset;
  expiresAt: Date;
  idempotencyKey: string;
};

export type CreatePaymentResult = CreateCryptoPaymentResult;

export type WebhookResult = { ok: true; paymentId: string; newStatus: PaymentStatus } | { ok: false; reason: string };
