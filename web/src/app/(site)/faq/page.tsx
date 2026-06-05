import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Modempic shipping, returns, crypto payments, accounts, and research-use notices.",
  alternates: { canonical: "/faq" },
};

const items = [
  {
    q: "Do you ship internationally?",
    a: "We currently sell in USD and ship within the United States. Expandable later as we scale operations.",
  },
  {
    q: "Are research-use products for human consumption?",
    a: "No. Products marked for research use are sold for laboratory/research purposes only and are not for human consumption, clinical use, diagnosis, treatment, or personal use. Always review the product page and label before ordering.",
  },
  {
    q: "How does crypto checkout work?",
    a: "At checkout you can select a supported digital asset. You will see pay-in instructions and a time window. Network fees and confirmation times depend on the blockchain, not Modempic.",
  },
  {
    q: "Can I check out as a guest?",
    a: "No. You need an account so we can tie your order to email and payment status. Registration is quick and you can sign in with Google when enabled.",
  },
];

export default function FaqPage() {
  const root = getSiteUrl().replace(/\/$/, "");
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${root}/faq`,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">FAQ</h1>
      <dl className="mt-10 max-w-2xl space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-[var(--foreground)]">{item.q}</dt>
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </Container>
  );
}
