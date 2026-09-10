import type { Metadata } from "next";
import type { CryptoAsset } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForOwner } from "@/lib/data/cart";
import { applyBuyNowSlugIfNeeded } from "@/lib/actions/apply-buy-now";
import { Container } from "@/components/site/container";
import { CheckoutProgress } from "./checkout-progress";
import { CheckoutTrustStrip } from "./checkout-trust-strip";
import { CheckoutFooterTrust } from "./checkout-footer-trust";
import { CheckoutClientSection } from "./checkout-client-section";
import {
  cryptoCheckoutMisconfigMessage,
  getAvailableCheckoutCryptoAssets,
  resolveCryptoCheckoutProviderForAsset,
  type CryptoCheckoutProvider,
} from "@/lib/payments/crypto-provider";
import { cardToUsdtMisconfigMessage, isCardToUsdtConfigured } from "@/lib/payments/cardtousdt";

export const metadata: Metadata = {
  title: "Complete Your Order",
  robots: { index: false, follow: false },
};

type Search = { buy?: string; qty?: string; tier?: string };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const session = await auth();

  if (sp.buy) {
    const applied = await applyBuyNowSlugIfNeeded(sp.buy, { tierIndex: sp.tier ?? null, quantity: sp.qty ?? null });
    if (applied) {
      redirect("/checkout");
    }
  }

  const cart = await getCartForOwner();
  const lines = cart?.items ?? [];
  if (lines.length === 0) {
    redirect("/cart");
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const availableAssets = getAvailableCheckoutCryptoAssets();
  const cardOnrampEnabled = isCardToUsdtConfigured();
  const assetProviders = Object.fromEntries(
    availableAssets.map((asset) => [asset, resolveCryptoCheckoutProviderForAsset(asset)!]),
  ) as Record<CryptoAsset, CryptoCheckoutProvider>;
  const signedIn = Boolean(session?.user?.id);
  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Customer";
  const checkoutIntro =
    cardOnrampEnabled && availableAssets.length > 0
      ? "Pay with a debit or credit card, or send cryptocurrency. Card checkout opens in a new tab."
      : cardOnrampEnabled
        ? "Pay with a debit or credit card. Checkout opens in a new tab."
        : "Enter billing and shipping details, then pay with cryptocurrency on Paymento.";

  if (availableAssets.length === 0 && !cardOnrampEnabled) {
    return (
      <div className="bg-background pb-20">
        <Container className="pt-10 sm:pt-12">
          <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Complete Your Order</h1>
              <p className="mt-2 text-sm text-muted-foreground">{checkoutIntro}</p>
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              <CheckoutProgress current="details" />
              <CheckoutTrustStrip />
            </div>
          </div>
          <p className="mt-10 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {cryptoCheckoutMisconfigMessage()} {cardToUsdtMisconfigMessage()}
          </p>
          <CheckoutFooterTrust />
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20">
      <Container className="pt-10 sm:pt-12">
        <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Complete Your Order</h1>
            <p className="mt-2 text-sm text-muted-foreground">{checkoutIntro}</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <CheckoutProgress current="details" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <CheckoutClientSection
          assets={availableAssets}
          userDisplayName={displayName}
          userEmail={session?.user?.email ?? ""}
          signedIn={signedIn}
          lines={lines}
          subtotalCents={subtotal}
          assetProviders={assetProviders}
          cardOnrampEnabled={cardOnrampEnabled}
        />

        <CheckoutFooterTrust />
      </Container>
    </div>
  );
}
