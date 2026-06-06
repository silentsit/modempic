import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isBtcpayConfigured } from "@/lib/payments/btcpay/client";
import { isPaymentoConfigured } from "@/lib/payments/paymento";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";
import {
  getAvailableCheckoutCryptoAssets,
  resolveCryptoCheckoutProviderForAsset,
} from "@/lib/payments/crypto-provider";

export async function GET() {
  let dbReachable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReachable = true;
  } catch (err) {
    console.error("[health] db check failed", err);
  }

  const acceptedAssets = acceptedCheckoutCryptoAssets();
  const availableAssets = getAvailableCheckoutCryptoAssets();
  const providersByAsset = Object.fromEntries(
    acceptedAssets.map((asset) => [asset, resolveCryptoCheckoutProviderForAsset(asset)]),
  );

  const since = new Date();
  since.setDate(since.getDate() - 7);

  let recentWebhookFailures = 0;
  if (dbReachable) {
    try {
      recentWebhookFailures = await prisma.webhookEvent.count({
        where: {
          createdAt: { gte: since },
          OR: [{ processed: false }, { signatureOk: false }],
        },
      });
    } catch (err) {
      console.error("[health] webhook failure count failed", err);
    }
  }

  return NextResponse.json({
    ok: dbReachable,
    service: "modempic-web",
    db: { reachable: dbReachable },
    payments: {
      btcpayConfigured: isBtcpayConfigured(),
      paymentoConfigured: isPaymentoConfigured(),
      acceptedCryptoAssets: acceptedAssets,
      availableCryptoAssets: availableAssets,
      providersByAsset,
    },
    webhooks: {
      recentFailures7d: recentWebhookFailures,
    },
  });
}
