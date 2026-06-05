import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { RESEARCH_CLUSTER_LINKS } from "@/content/category-clusters";

export const metadata: Metadata = {
  title: "Research material storage guide",
  description:
    "Catalog guidance on storing research-use materials: temperature, light exposure, reconstitution notes, and what to verify on product pages.",
  alternates: { canonical: "/research/storage" },
};

const sections = [
  {
    title: "Check the product record first",
    body: "Modempic product pages may include storage notes, handling restrictions, and research-use disclaimers. Always follow the label and product-page fields for the specific item you ordered.",
  },
  {
    title: "Temperature and light",
    body: "Many research materials are sensitive to heat and UV exposure. Store in a cool, dry place unless the product page specifies refrigeration or freezer storage.",
  },
  {
    title: "Reconstitution and handling",
    body: "If a product requires reconstitution, use the solvents, volumes, and handling steps described on the product page or included documentation. This guide does not provide laboratory protocols.",
  },
];

export default function ResearchStoragePage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Research guides", href: "/research/testing-coa" },
          { label: "Storage guide" },
        ]}
      />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Research material storage guide</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
        Catalog and handling information for research-use items. This page is not medical, clinical, dosage, or
        personal-use guidance.
      </p>

      <div className="mt-10 max-w-2xl space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{section.title}</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">{section.body}</p>
          </section>
        ))}
      </div>

      <RelatedLinks heading="Related research resources" links={[...RESEARCH_CLUSTER_LINKS]} className="max-w-3xl" />
    </Container>
  );
}
