import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForUser } from "@/lib/data/cart";
import { applyBuyNowSlugIfNeeded } from "@/lib/actions/apply-buy-now";
import { Container } from "@/components/site/container";
import { LoginForm } from "@/app/(auth)/login/ui";
import { RegisterForm } from "@/app/(auth)/register/ui";
import { oauthSocialProvidersForUi } from "@/lib/oauth-ui-providers";
import { acceptedCheckoutCryptoAssets } from "@/lib/payments/accepted-crypto-assets";
import { resolveCryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import { getBtcpayPublicUrl } from "@/lib/payments/btcpay";
import { CheckoutProgress } from "./checkout-progress";
import { CheckoutTrustStrip } from "./checkout-trust-strip";
import { CheckoutFooterTrust } from "./checkout-footer-trust";
import { CheckoutClientSection } from "./checkout-client-section";

export const metadata: Metadata = {
  title: "Complete your order",
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
      <Container className="py-10 sm:py-12">
        <div className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Complete your order</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Sign in to continue · Always affordable prices | Modempic</p>
          </div>
          <div className="flex flex-col items-stretch gap-4 sm:items-end">
            <CheckoutProgress current="details" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          An account is required before payment. Use your email below—after signing in, you will return here to finish checkout.
        </p>

        <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Account required for checkout">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Already have an account? Sign in to continue.</p>
            <LoginForm socialProviders={socialProviders} callbackUrl={checkoutPath} idPrefix="checkout-login" />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">New to Modempic? Create an account to place your order and track it later.</p>
            <RegisterForm socialProviders={socialProviders} callbackUrl={checkoutPath} idPrefix="checkout-register" />
          </div>
        </section>

        {sp.buy ? (
          <p className="mt-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
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
  const assets = acceptedCheckoutCryptoAssets();
  const displayName = session.user.name?.trim() || session.user.email?.split("@")[0] || "Customer";
  const cryptoProvider = resolveCryptoCheckoutProvider();
  const btcpayUrl = getBtcpayPublicUrl();

  return (
    <div className="bg-[var(--background)] pb-16">
      <Container className="pt-8 sm:pt-10">
        <div className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Complete your order</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Always affordable prices | Modempic</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <CheckoutProgress current="details" />
            <CheckoutTrustStrip />
          </div>
        </div>

        <CheckoutClientSection
          assets={assets}
          userDisplayName={displayName}
          userEmail={session.user.email ?? ""}
          lines={lines}
          subtotalCents={subtotal}
          cryptoProvider={cryptoProvider}
          btcpayUrl={btcpayUrl}
        />

        <CheckoutFooterTrust />
      </Container>
    </div>
  );
}
