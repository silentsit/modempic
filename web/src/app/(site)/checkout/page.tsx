import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForUser } from "@/lib/data/cart";
import { applyBuyNowSlugIfNeeded } from "@/lib/actions/apply-buy-now";
import { formatUsd } from "@/lib/domain/money";
import { Container } from "@/components/site/container";
import { LoginForm } from "@/app/(auth)/login/ui";
import { RegisterForm } from "@/app/(auth)/register/ui";
import { CheckoutForm } from "./ui";
import { CryptoAsset } from "@prisma/client";

export const metadata: Metadata = {
  title: "Checkout",
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
    const showGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);
    return (
      <Container className="py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          An account is required before payment and order submission. Sign in or create an account here to keep your
          checkout progress on this page.
        </p>

        <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Account required for checkout">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Already have an account? Sign in and we will continue checkout automatically.
            </p>
            <LoginForm showGoogle={showGoogle} callbackUrl={checkoutPath} idPrefix="checkout-login" />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-xl font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              New to Modempic? Create an account to place the order and track it later.
            </p>
            <RegisterForm showGoogle={showGoogle} callbackUrl={checkoutPath} idPrefix="checkout-register" />
          </div>
        </section>

        {sp.buy ? (
          <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            Your selected product will be added to checkout after you sign in or create your account.
          </p>
        ) : null}
      </Container>
    );
  }

  if (sp.buy) {
    await applyBuyNowSlugIfNeeded(sp.buy, { tierIndex: sp.tier ?? null, quantity: sp.qty ?? null });
  }

  const cart = await getCartForUser(session.user.id);
  const lines = cart?.items ?? [];
  if (lines.length === 0) {
    redirect("/cart");
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const shippingCents = subtotal >= 5000 ? 0 : 599;
  const taxCents = Math.round(subtotal * 0.06);
  const estTotal = subtotal + taxCents + shippingCents;

  const assets = Object.values(CryptoAsset);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Signed in as <strong className="text-[var(--foreground)]">{session.user.email}</strong>
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm assets={assets} />
        </div>
        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold">Summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span>
                  {l.product.name} × {l.quantity}
                </span>
                <span>{formatUsd(l.unitPriceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-sm text-[var(--muted-foreground)]">
            <span>Est. tax (example 6%)</span>
            <span>{formatUsd(taxCents)}</span>
          </p>
          <p className="mt-1 flex justify-between text-sm text-[var(--muted-foreground)]">
            <span>Shipping</span>
            <span>{shippingCents === 0 ? "Free" : formatUsd(shippingCents)}</span>
          </p>
          <p className="mt-4 flex justify-between font-semibold">
            <span>Estimated total</span>
            <span>{formatUsd(estTotal)}</span>
          </p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Final tax and shipping may adjust at order creation. Coupon applies on submit.
          </p>
        </aside>
      </div>
    </Container>
  );
}
