import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { RESEARCH_CLUSTER_LINKS } from "@/content/category-clusters";

export const metadata: Metadata = {
  title: "Testing & COA explainer",
  description:
    "How Modempic product pages surface purity, testing status, and certificate-of-analysis links for research-use catalog items.",
  alternates: { canonical: "/research/testing-coa" },
};

const items = [
  {
    q: "What is a COA link on a product page?",
    a: "When provided, a COA (certificate of analysis) link points to third-party or supplier testing documentation for that catalog record. Availability varies by product.",
  },
  {
    q: "What does testing status mean?",
    a: "Testing status is a short catalog field describing whether analytical testing documentation is available, pending, or not listed for that item.",
  },
  {
    q: "Does this page certify product quality?",
    a: "No. This explainer describes how catalog fields are presented. It is not a laboratory report, medical guidance, or guarantee of suitability for any use.",
  },
];

export default function TestingCoaPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Research guides" },
          { label: "Testing & COA" },
        ]}
      />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Testing & COA explainer</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
        Understand the research-use fields shown on peptide and specialty catalog pages before you compare products or
        place an order.
      </p>

      <dl className="mt-10 max-w-2xl space-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-[var(--foreground)]">{item.q}</dt>
            <dd className="mt-2 text-[var(--muted-foreground)]">{item.a}</dd>
          </div>
        ))}
      </dl>

      <RelatedLinks
        heading="Related research resources"
        links={RESEARCH_CLUSTER_LINKS.filter((l) => l.href !== "/research/testing-coa")}
        className="max-w-3xl"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </Container>
  );
}
