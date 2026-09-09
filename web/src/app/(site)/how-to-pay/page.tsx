import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import {
  ACCEPTED_CHECKOUT_CRYPTO_ASSETS,
  cryptoAssetCheckoutLabel,
} from "@/lib/payments/accepted-crypto-assets";

const HOW_TO_PAY_DESCRIPTION =
  "How payment works at Modempic: cryptocurrency checkout via Paymento — supported assets, confirmation timing, and how your order gets marked paid.";

export const metadata: Metadata = {
  title: "How to Pay",
  description: HOW_TO_PAY_DESCRIPTION,
  alternates: { canonical: "/how-to-pay" },
  openGraph: {
    title: "How to Pay | Modempic",
    description: HOW_TO_PAY_DESCRIPTION,
    url: "/how-to-pay",
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Pay | Modempic",
    description: HOW_TO_PAY_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

const steps = [
  {
    icon: ClipboardList,
    title: "Place your order",
    body: "Add products to your cart and go to checkout with your shipping details.",
  },
  {
    icon: Wallet,
    title: "Choose a cryptocurrency",
    body: "Select BTC, USDT, or another accepted asset on the checkout page.",
  },
  {
    icon: Lock,
    title: "Complete payment on Paymento",
    body: "After you submit checkout, Paymento’s hosted page shows the wallet address and amount to send.",
  },
  {
    icon: CheckCircle2,
    title: "Order confirmed",
    body: "Once Paymento verifies your transfer, your order status updates to paid and moves into fulfillment.",
  },
] as const;

const timeline = [
  { label: "Payment submitted", body: "You send crypto from your wallet to the Paymento address.", time: "0 min" },
  { label: "Network confirmation", body: "Paymento waits for the required blockchain confirmations.", time: "Typically 1–10 min" },
  { label: "Order confirmed", body: "Order status updates to Paid once Paymento verifies funds.", time: "Shortly after confirmation" },
  { label: "Order ships", body: "Fulfillment begins after your order is marked paid.", time: "Within 1 business day" },
] as const;

const faqs = [
  {
    q: "Which cryptocurrencies are supported?",
    a: `Checkout is cryptocurrency-only via Paymento. Supported assets include ${ACCEPTED_CHECKOUT_CRYPTO_ASSETS.map(cryptoAssetCheckoutLabel).join(", ")}.`,
  },
  {
    q: "How long does payment confirmation take?",
    a: "Most crypto payments confirm within a few minutes once the network verifies your transaction. Timing depends on the asset and network conditions.",
  },
  {
    q: "What happens if my payment fails or doesn't confirm?",
    a: "Your order stays unpaid and no product is shipped. If a transfer doesn't reflect after confirmation, contact support with your order number and we'll help you resolve it.",
  },
  {
    q: "Do I need an account to check out?",
    a: "No. Guest checkout is available — enter an email for order updates. If that email already has an account, sign in instead.",
  },
] as const;

export default function HowToPayPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "How to Pay" }]} />

      <Badge className="mt-4">Payments</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">How to Pay</h1>
      <p className="prose-custom mt-4 max-w-2xl text-[var(--muted-foreground)]">
        Modempic checkout is cryptocurrency-only. You pay on Paymento&apos;s secure hosted page; we never handle
        wallet keys or store crypto on this site.
      </p>

      <section className="mt-12" aria-labelledby="process-heading">
        <h2 id="process-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          The Payment Process
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <step.icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                  {titleCaseHeading(step.title)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="crypto-heading">
        <h2 id="crypto-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Accepted Cryptocurrencies
        </h2>
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:p-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-subtle" aria-hidden>
            <Wallet className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-semibold text-foreground">Paymento checkout</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Pay with any of the assets below. Paymento shows the exact amount and wallet address after you submit
              checkout.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {ACCEPTED_CHECKOUT_CRYPTO_ASSETS.map((asset) => (
                <li
                  key={asset}
                  className="rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-medium text-foreground"
                >
                  {cryptoAssetCheckoutLabel(asset)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="protected-heading">
        <h2 id="protected-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Your Payment Is Protected
        </h2>
        <div className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
          <p>
            Payments are verified through signed webhooks from Paymento before any order is marked paid — no order
            ships until payment is confirmed.
          </p>
        </div>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Transaction timeline
        </h3>
        <ol className="mt-4 space-y-3">
          {timeline.map((row, i) => (
            <li
              key={row.label}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground">{row.body}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-right">{row.time}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Payment Questions
        </h2>
        <dl className="mt-6 max-w-2xl space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="text-base font-semibold text-foreground">{titleCaseHeading(item.q)}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-primary-subtle p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-3">
          <Banknote className="mt-0.5 h-6 w-6 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">Ready to Order?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the shop and check out with cryptocurrency whenever you&apos;re ready.
            </p>
          </div>
        </div>
        <Link
          href="/shop"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Shop all products
        </Link>
      </section>

      <RelatedLinks
        links={[
          { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and customs." },
          { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and the return process." },
          { href: "/faq", label: "FAQ", description: "Common questions about orders and accounts." },
          { href: "/contact", label: "Contact support", description: "Email reply within one business day." },
        ]}
      />

      <JsonLd
        data={buildWebPageJsonLd({
          name: "How to Pay",
          description: HOW_TO_PAY_DESCRIPTION,
          path: "/how-to-pay",
          baseUrl: getSiteUrl(),
        })}
      />
    </Container>
  );
}
