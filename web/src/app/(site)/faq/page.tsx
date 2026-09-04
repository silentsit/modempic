import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { JsonLd } from "@/components/seo/json-ld";
import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

const FAQ_DESCRIPTION =
  "Frequently asked questions about Modempic shipping, returns, card and crypto payments, and accounts.";

export const metadata: Metadata = {
  title: "FAQ",
  description: FAQ_DESCRIPTION,
  alternates: { canonical: "/faq" },
  ...pageSocialMetadata({ title: "FAQ", description: FAQ_DESCRIPTION, path: "/faq" }),
};

const items = [
  {
    q: "Do you ship internationally?",
    a: "Yes. Prices are in USD. Free shipping on every order worldwide. Typical delivery is 2–7 business days to the USA, Canada, Australia, and the UK; 2–4 days in South-East Asia; 5–11 days elsewhere. See shipping for tracking and customs.",
  },
  {
    q: "Are Modempic products for self-diagnosis or treatment?",
    a: "No. Product pages are for catalog and ordering information only. Always review the product page and label, and consult a qualified clinician for personal health decisions.",
  },
  {
    q: "How does payment work?",
    a: "Card is the default at checkout (Apple Pay, Google Pay, Visa, Mastercard, Amex). Cryptocurrency remains available. You complete payment on a hosted checkout page; your order is confirmed after the provider verifies payment.",
  },
  {
    q: "Can I check out as a guest?",
    a: "Yes. Enter your email at checkout. If that email already has an account, sign in instead. Order updates go to the email you give us.",
  },
];

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">FAQ</h1>
      <dl className="mt-10 max-w-2xl space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-[var(--foreground)]">{titleCaseHeading(item.q)}</dt>
            <dd className="mt-2 text-[var(--muted-foreground)]">{item.a}</dd>
          </div>
        ))}
      </dl>

      <RelatedLinks
        links={[
          { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and customs." },
          { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and the return process." },
          { href: "/contact", label: "Contact support", description: "Email reply within one business day." },
          { href: "/shop", label: "Shop", description: "Browse all products." },
        ]}
      />

      <JsonLd
        data={buildWebPageJsonLd({
          name: "FAQ",
          description: FAQ_DESCRIPTION,
          path: "/faq",
          baseUrl: getSiteUrl(),
        })}
      />
    </Container>
  );
}
