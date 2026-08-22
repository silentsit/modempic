import type { Metadata } from "next";
import type { CryptoAsset } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForUser } from "@/lib/data/cart";
import { applyBuyNowSlugIfNeeded } from "@/lib/actions/apply-buy-now";
import { Container } from "@/components/site/container";
import { LoginForm } from "@/app/(auth)/login/ui";
import { RegisterForm } from "@/app/(auth)/register/ui";
import { oauthSocialProvidersForUi } from "@/lib/oauth-ui-providers";
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
import { isPeptidePayConfigured } from "@/lib/payments/peptidepay";

export const metadata: Metadata = {
  title: "Complete Your Order",
  robots: { index: false, follow: false },
};

type Search = { buy?: string; qty?: string; tier?: string };

function buildCheckoutPath(sp: Search): string {
  const params = new URLSearchParams();
  if (sp.buy) params.set("buy", sp.buy);
  if (sp.qty) params.set("qty", sp.qty);
  if (sp.tier) params.set("tier", sp.tier);
  const query = params.toString();
  return query ? `/checkout?${query}` : "/checkout";
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const checkoutPath = buildCheckoutPath(sp);
  const session = await auth();
  if (!session?.user?.id) {
    const socialProviders = oauthSocialProvidersForUi();
    return (
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Complete Your Order</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to finish your order. Card is the default payment method; crypto remains available.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 sm:items-end">
            <CheckoutProgress current="details" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_min(320px,100%)] lg:items-start">
          <p className="text-sm leading-relaxed text-muted-foreground">
            One quick sign-in keeps your cart, payment status, tracking, and support history in one place. You&apos;ll
            return here immediately after signing in — no need to re-select your product.
          </p>
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <p className="font-semibold text-foreground">What Happens Next</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-muted-foreground">
              <li>Sign in or create a free account</li>
              <li>Enter shipping and choose card (default) or crypto</li>
              <li>Pay on the secure hosted checkout page</li>
            </ol>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Account required for checkout">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Sign In</h2>
            <p className="mt-1 text-sm text-muted-foreground">Already have an account? Sign in to continue.</p>
            <LoginForm socialProviders={socialProviders} callbackUrl={checkoutPath} idPrefix="checkout-login" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Create Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New to Modempic? Create an account to place your order and track payment/order updates later.
            </p>
            <RegisterForm socialProviders={socialProviders} callbackUrl={checkoutPath} idPrefix="checkout-register" />
          </div>
        </section>

        {sp.buy ? (
          <p className="mt-8 rounded-2xl border border-accent/25 bg-accent-subtle px-4 py-3 text-sm text-accent">
            Your selected product will be added to the cart after you sign in or register.
          </p>
        ) : null}
      </Container>
    );
  }

  if (sp.buy) {
    const applied = await applyBuyNowSlugIfNeeded(sp.buy, { tierIndex: sp.tier ?? null, quantity: sp.qty ?? null });
    if (applied) {
      redirect("/checkout");
    }
  }

  const cart = await getCartForUser(session.user.id);
  const lines = cart?.items ?? [];
  if (lines.length === 0) {
    redirect("/cart");
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const availableAssets = getAvailableCheckoutCryptoAssets();
  const cardEnabled = isPeptidePayConfigured();
  const assetProviders = Object.fromEntries(
    availableAssets.map((asset) => [asset, resolveCryptoCheckoutProviderForAsset(asset)!]),
  ) as Record<CryptoAsset, CryptoCheckoutProvider>;
  const displayName = session.user.name?.trim() || session.user.email?.split("@")[0] || "Customer";

  if (!cardEnabled && availableAssets.length === 0) {
    return (
      <div className="bg-background pb-20">
        <Container className="pt-10 sm:pt-12">
          <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Complete Your Order</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose your payment method after entering billing and shipping details.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              <CheckoutProgress current="details" />
              <CheckoutTrustStrip />
            </div>
          </div>
          <p className="mt-10 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {cryptoCheckoutMisconfigMessage()} Card checkout also requires PEPTIDEPAY_API_KEY and
            PEPTIDEPAY_WEBHOOK_SECRET.
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
            <p className="mt-2 text-sm text-muted-foreground">
              Card is selected by default. Cryptocurrency remains available as an optional method.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <CheckoutProgress current="details" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <CheckoutClientSection
          assets={availableAssets}
          userDisplayName={displayName}
          userEmail={session.user.email ?? ""}
          lines={lines}
          subtotalCents={subtotal}
          assetProviders={assetProviders}
          cardEnabled={cardEnabled}
        />

        <CheckoutFooterTrust />
      </Container>
    </div>
  );
}
